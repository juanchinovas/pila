import { InlineParser } from '../inline/InlineParser';
import { InlineRenderer } from '../inline/InlineRenderer';
import { Block } from '../types';
import { PilaBlock } from './PilaBlock';

export class TodoBlock extends PilaBlock {
  private contentEl!: HTMLElement;
  private checkbox!: HTMLInputElement;

  protected get contentEditableEl(): HTMLElement {
    return this.contentEl;
  }

  protected buildDOM(): void {
    this.classList.add('flex', 'items-center', 'gap-x-2', 'px-0.5', 'py-[3px]');

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    // keep pila-todo-checkbox for :checked + .pila-todo-content sibling CSS
    this.checkbox.className = 'pila-todo-checkbox flex-shrink-0 mt-[3px] w-4 h-4 cursor-pointer accent-[var(--pila-accent)] rounded-sm';
    this.checkbox.checked = this.block.attrs?.checked ?? false;
    this.checkbox.addEventListener('change', () => {
      this.ctx.manager.update(this.block.id!, {
        content: InlineParser.parse(this.contentEl),
        attrs: { ...this.block.attrs, checked: this.checkbox.checked },
      });
    });

    // keep pila-todo-content for :checked + .pila-todo-content sibling CSS
    this.contentEl = this.makeContentEditable(
      'span',
      this.block.content ?? [],
      'pila-todo-content flex-1 outline-none whitespace-pre-wrap break-words'
    );

    this.appendChild(this.checkbox);
    this.appendChild(this.contentEl);
  }

  protected override handleEnter(el: HTMLElement): void {
    const text = el.textContent ?? '';
    if (text.trim() === '') {
      // Empty todo: turn into paragraph
      this.ctx.manager.update(this.block.id!, { type: 'paragraph', content: [], attrs: {} });
      return;
    }

    const { before, after } = this.splitAtCaret(el);
    this.ctx.manager.update(this.block.id!, { content: before });

    const newBlock = this.ctx.manager.add('todo', {
      content: after,
      afterId: this.block.id!,
      attrs: { checked: false },
    });

    requestAnimationFrame(() => {
      const newEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id!}"] [contenteditable]`
      ) as HTMLElement | null;
      newEl?.focus();
    });
  }

  override updateData(block: Block): void {
    super.updateData(block);
    if (this.contentEl) {
      this.checkbox.checked = block.attrs?.checked ?? false;
      InlineRenderer.render(this.contentEl, block.content ?? []);
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: InlineParser.parse(this.contentEl),
      attrs: { ...this.block.attrs, checked: this.checkbox.checked },
    };
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus();
    if (offset !== undefined) this.setCaret(this.contentEl, offset);
  }
}

if (!customElements.get('pila-todo')) {
  customElements.define('pila-todo', TodoBlock);
}
