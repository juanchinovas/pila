import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block } from '../types'
import { PilaBlock } from './PilaBlock'

export class CalloutBlock extends PilaBlock {
  private contentEl!: HTMLElement
  private iconEl!: HTMLElement

  protected buildDOM(): void {
    const flavor = this.block.attrs?.flavor ?? 'info'
    this.classList.add('pila-callout', `pila-callout--${flavor}`)

    this.iconEl = document.createElement('span')
    this.iconEl.className = 'pila-callout-icon'
    this.iconEl.textContent = this.block.attrs?.icon ?? '💡'
    this.iconEl.setAttribute('contenteditable', 'true')
    this.iconEl.setAttribute('spellcheck', 'false')
    this.iconEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.contentEl.focus()
      }
    })

    this.contentEl = this.makeContentEditable(
      'p',
      this.block.content ?? [],
      'pila-callout-content'
    )

    // Shift+Enter exits
    this.contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id })
        requestAnimationFrame(() => {
          const el = this.ctx.editorEl.querySelector(
            `[data-block-id="${newBlock.id}"] [contenteditable]`
          ) as HTMLElement | null
          el?.focus()
        })
      }
    })

    this.appendChild(this.iconEl)
    this.appendChild(this.contentEl)
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.contentEl) {
      this.iconEl.textContent = block.attrs?.icon ?? '💡'
      // Swap flavor class
      const flavor = block.attrs?.flavor ?? 'info'
      this.classList.forEach(cls => { if (cls.startsWith('pila-callout--')) this.classList.remove(cls) })
      this.classList.add(`pila-callout--${flavor}`)
      InlineRenderer.render(this.contentEl, block.content ?? [])
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: InlineParser.parse(this.contentEl),
      attrs: {
        ...this.block.attrs,
        icon: this.iconEl.textContent ?? '💡',
      },
    }
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus()
    if (offset !== undefined) this.setCaret(this.contentEl, offset)
  }
}

if (!customElements.get('pila-callout')) {
  customElements.define('pila-callout', CalloutBlock)
}
