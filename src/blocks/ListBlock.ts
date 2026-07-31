import { InlineParser } from '../inline/InlineParser';
import { InlineRenderer } from '../inline/InlineRenderer';
import { Block } from '../types';
import { PilaBlock } from './PilaBlock';

export class ListBlock extends PilaBlock {
  private contentEl!: HTMLElement;
  private markerEl!: HTMLElement;
  private indentLevel = 0;

  protected get contentEditableEl(): HTMLElement {
    return this.contentEl;
  }

  protected buildDOM(): void {
    const isBullet = this.block.type === 'bulletList';

    this.classList.add('flex', 'items-center', 'gap-1', 'py-0.5', 'px-1', 'mt-5');

    const li = this.makeContentEditable(
      'li',
      this.block.content ?? [],
      'flex-1 outline-none min-h-[1.4em] whitespace-pre-wrap break-words list-none'
    );

    // Tab / Shift+Tab indentation
    this.eventGroup.on(li, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          this.indentLevel = Math.max(0, this.indentLevel - 1);
        } else {
          this.indentLevel = Math.min(6, this.indentLevel + 1);
        }
        this.style.paddingLeft = `${this.indentLevel * 24}px`;
      }
    });

    const marker = document.createElement('span');
    marker.className = 'flex-shrink-0 min-w-[20px] text-[color:var(--pila-muted)] text-[0.9em] select-none';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = isBullet ? '•' : `${this.orderedIndex()}.`;
    marker.dataset.ordered = String(!isBullet);
    this.markerEl = marker;

    this.appendChild(marker);
    this.appendChild(li);
    this.contentEl = li;
  }

  protected override handleEnter(el: HTMLElement): void {
    const text = el.textContent ?? '';
    if (text.trim() === '') {
      // Empty list item: exit list and turn into paragraph
      this.ctx.manager.update(this.block.id!, { type: 'paragraph', content: [] });
      return;
    }

    const { before, after } = this.splitAtCaret(el);
    InlineRenderer.render(el, before);
    this.ctx.manager.update(this.block.id!, { content: before });

    const newBlock = this.ctx.manager.add(this.block.type, {
      content: after,
      afterId: this.block.id!,
    });

    requestAnimationFrame(() => {
      const newEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id!}"][contenteditable]`
      ) as HTMLElement | null;
      newEl?.focus();
    });
  }

  override updateData(block: Block): void {
    super.updateData(block);
    if (this.contentEl) {
      if (this.block.type === 'numberedList' && this.markerEl) {
        this.markerEl.textContent = `${this.orderedIndex()}.`;
      }
      if (this.contentNeedsRerender) {
        InlineRenderer.render(this.contentEl, this.block.content ?? []);
      }
    }
  }

  /** Returns the 1-based position of this block within its consecutive numbered-list run. */
  private orderedIndex(): number {
    const all = this.ctx.manager.getAll();
    const pos = all.findIndex((b) => b.id! === this.block.id!);
    if (pos === -1) return 1;
    let count = 1;
    for (let i = pos - 1; i >= 0; i--) {
      if (all[i].type !== 'numberedList') break;
      count++;
    }
    return count;
  }

  getContent(): Block {
    return {
      ...this.block,
      content: this.contentEl ? InlineParser.parse(this.contentEl) : this.block.content,
    };
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus();
    if (offset !== undefined) this.setCaret(this.contentEl, offset);
  }
}

if (!customElements.get('pila-list')) {
  customElements.define('pila-list', ListBlock);
}
