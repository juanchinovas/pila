import { InlineParser } from '../inline/InlineParser';
import { InlineRenderer } from '../inline/InlineRenderer';
import { Block } from '../types';
import { PilaBlock } from './PilaBlock';
import type { BlockAction } from '../ui/BlockPopover';

export class CalloutBlock extends PilaBlock {
  private iconEl!: HTMLElement;
  private contentEl!: HTMLElement;

  protected get contentEditableEl(): HTMLElement {
    return this.contentEl;
  }

  protected buildDOM(): void {
    const flavor = this.block.attrs?.flavor ?? 'info';
    this.classList.add('pila-callout', `pila-callout--${flavor}`);

    this.iconEl = document.createElement('span');
    this.iconEl.className = 'pila-callout-icon';
    this.iconEl.textContent = this.block.attrs?.icon ?? '💡';
    this.iconEl.setAttribute('contenteditable', 'true');
    this.iconEl.setAttribute('spellcheck', 'false');
    this.eventGroup.on(this.iconEl, 'keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.contentEl.focus();
      }
    });

    this.contentEl = this.makeContentEditable(
      'p',
      this.block.content ?? [],
      'pila-callout-content'
    );

    // Shift+Enter exits
    this.eventGroup.on(this.contentEl, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id! });
        requestAnimationFrame(() => {
          const el = this.ctx.editorEl.querySelector(
            `[data-block-id="${newBlock.id!}"] [contenteditable]`
          ) as HTMLElement | null;
          el?.focus();
        });
      }
    });

    this.appendChild(this.iconEl);
    this.appendChild(this.contentEl);
  }

  get colorOptions(): boolean {
    return false;
  }

  override getPopoverActions(): BlockAction[] {
    const flavors = ['info', 'warning', 'error', 'success', 'tip'] as const;
    const flavorIcons: Record<string, string> = {
      info: '💡', warning: '⚠️', error: '❌', success: '✅', tip: '💡',
    };

    return [
      {
        label: 'Flavor',
        icon: 'Palette',
        type: 'action',
        children: flavors.map(f => ({
          label: f.charAt(0).toUpperCase() + f.slice(1),
          icon: flavorIcons[f],
          type: 'action',
          value: { flavor: f, icon: flavorIcons[f] },
          handler: (ev: CustomEvent<BlockAction>) => {
            const { flavor, icon } = ev.detail.value as { flavor: typeof flavors[number]; icon: string };
            this.ctx.manager.update(this.block.id!, {
              attrs: {
                ...this.block.attrs,
                flavor,
                icon,
              },
            });
          },
        })),
      },
      { label: '', type: 'divider' },
      ...super.getPopoverActions(),
    ];
  }

  override updateData(block: Block): void {
    super.updateData(block);
    if (this.contentEl) {
      this.iconEl.textContent = block.attrs?.icon ?? '💡';
      // Swap flavor class
      const flavor = block.attrs?.flavor ?? 'info';
      this.classList.forEach(cls => { if (cls.startsWith('pila-callout--')) this.classList.remove(cls); });
      this.classList.add(`pila-callout--${flavor}`);
      if (this.contentNeedsRerender) {
        InlineRenderer.render(this.contentEl, this.block.content ?? []);
      }
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: this.contentEl ? InlineParser.parse(this.contentEl) : this.block.content,
      attrs: {
        ...this.block.attrs,
        icon: this.iconEl ? this.iconEl.textContent! : this.block.attrs?.icon ?? '💡',
      },
    };
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus();
    if (offset !== undefined) this.setCaret(this.contentEl, offset);
  }
}

if (!customElements.get('pila-callout')) {
  customElements.define('pila-callout', CalloutBlock);
}
