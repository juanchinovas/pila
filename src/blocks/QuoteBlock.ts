import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block } from '../types'
import { PilaBlock } from './PilaBlock'

export class QuoteBlock extends PilaBlock {
  private contentEl!: HTMLElement

  protected buildDOM(): void {
    this.classList.add('pila-quote')

    this.contentEl = this.makeContentEditable(
      'blockquote',
      this.block.content ?? [],
      'pila-quote-content'
    )

    // Shift+Enter exits the block
    this.contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        this.exitAndAddParagraph()
      }
    })

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

  private exitAndAddParagraph(): void {
    const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id })
    requestAnimationFrame(() => {
      const el = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id}"] [contenteditable]`
      ) as HTMLElement | null
      el?.focus()
    })
  }
}

if (!customElements.get('pila-quote')) {
  customElements.define('pila-quote', QuoteBlock)
}
