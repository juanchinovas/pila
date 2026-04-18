import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block } from '../types'
import { PilaBlock } from './PilaBlock'

export class TodoBlock extends PilaBlock {
  private contentEl!: HTMLElement
  private checkbox!: HTMLInputElement

  protected buildDOM(): void {
    this.classList.add('flex', 'items-start', 'gap-2', 'px-0.5', 'py-[3px]')

    this.checkbox = document.createElement('input')
    this.checkbox.type = 'checkbox'
    // keep pila-todo-checkbox for :checked + .pila-todo-content sibling CSS
    this.checkbox.className = 'pila-todo-checkbox flex-shrink-0 mt-[3px] w-4 h-4 cursor-pointer accent-[var(--pila-accent)] rounded-sm'
    this.checkbox.checked = this.block.attrs?.checked ?? false
    this.checkbox.addEventListener('change', () => {
      this.ctx.manager.update(this.block.id, {
        content: InlineParser.parse(this.contentEl),
        attrs: { ...this.block.attrs, checked: this.checkbox.checked },
      })
    })

    // keep pila-todo-content for :checked + .pila-todo-content sibling CSS
    this.contentEl = this.makeContentEditable(
      'span',
      this.block.content ?? [],
      'pila-todo-content flex-1 outline-none whitespace-pre-wrap break-words'
    )

    this.appendChild(this.checkbox)
    this.appendChild(this.contentEl)
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.contentEl) {
      this.checkbox.checked = block.attrs?.checked ?? false
      InlineRenderer.render(this.contentEl, block.content ?? [])
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: InlineParser.parse(this.contentEl),
      attrs: { ...this.block.attrs, checked: this.checkbox.checked },
    }
  }

  focusBlock(offset?: number): void {
    this.contentEl.focus()
    if (offset !== undefined) this.setCaret(this.contentEl, offset)
  }
}

if (!customElements.get('pila-todo')) {
  customElements.define('pila-todo', TodoBlock)
}
