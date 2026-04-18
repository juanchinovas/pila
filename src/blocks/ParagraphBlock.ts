import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block } from '../types'
import { PilaBlock } from './PilaBlock'

export class ParagraphBlock extends PilaBlock {
  private contentEl!: HTMLElement

  protected buildDOM(): void {
    this.contentEl = this.makeContentEditable(
      'p',
      this.block.content ?? [],
      // keep pila-paragraph for placeholder ::before CSS selector
      'pila-paragraph m-0 px-0.5 py-[3px] min-h-[1.65em] outline-none whitespace-pre-wrap break-words'
    )

    if (!this.block.content?.length) {
      this.contentEl.setAttribute('data-placeholder', this.ctx.placeholder ?? 'Type / to add a block…')
    }

    this.appendChild(this.contentEl)
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.contentEl) {
      InlineRenderer.render(this.contentEl, block.content ?? [])
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: InlineParser.parse(this.contentEl),
    }
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus()
    if (offset !== undefined) this.setCaret(this.contentEl, offset)
  }
}

if (!customElements.get('pila-paragraph')) {
  customElements.define('pila-paragraph', ParagraphBlock)
}
