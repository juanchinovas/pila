import { InlineParser } from '../inline/InlineParser';
import { InlineRenderer } from '../inline/InlineRenderer';
import { Block } from '../types';
import { PilaBlock } from './PilaBlock';

export class QuoteBlock extends PilaBlock {
  private contentEl!: HTMLElement;

  protected get contentEditableEl(): HTMLElement {
    return this.contentEl;
  }

  protected buildDOM(): void {
    this.classList.add('pila-quote', '!my-5');

    this.contentEl = this.makeContentEditable(
      'blockquote',
      this.block.content ?? [],
      'pila-quote-content'
    );

    // Shift+Enter exits the block
    this.eventGroup.on(this.contentEl, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        this.exitAndAddParagraph();
      }
    });

    this.appendChild(this.contentEl);
  }

  override updateData(block: Block): void {
    super.updateData(block);
    if (this.contentEl && this.contentNeedsRerender) {
      InlineRenderer.render(this.contentEl, this.block.content ?? []);
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: InlineParser.parse(this.contentEl),
    };
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus();
    if (offset !== undefined) this.setCaret(this.contentEl, offset);
  }

  private exitAndAddParagraph(): void {
    const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id! });
    requestAnimationFrame(() => {
      const el = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id!}"] [contenteditable]`
      ) as HTMLElement | null;
      el?.focus();
    });
  }
}

if (!customElements.get('pila-quote')) {
  customElements.define('pila-quote', QuoteBlock);
}
