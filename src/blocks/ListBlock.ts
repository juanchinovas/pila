import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block } from '../types'
import { PilaBlock } from './PilaBlock'

export class ListBlock extends PilaBlock {
  private contentEl!: HTMLElement
  private markerEl!: HTMLElement
  private indentLevel = 0

  protected buildDOM(): void {
    const isBullet = this.block.type === 'bulletList'

    this.classList.add('flex', 'items-baseline', 'gap-2', 'py-0.5', 'px-1')

    const li = this.makeContentEditable(
      'li',
      this.block.content ?? [],
      'flex-1 outline-none min-h-[1.4em] whitespace-pre-wrap break-words list-none'
    )

    // Tab / Shift+Tab indentation
    li.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          this.indentLevel = Math.max(0, this.indentLevel - 1)
        } else {
          this.indentLevel = Math.min(6, this.indentLevel + 1)
        }
        this.style.paddingLeft = `${this.indentLevel * 24}px`
      }
    })

    const marker = document.createElement('span')
    marker.className = 'flex-shrink-0 min-w-[20px] text-[color:var(--pila-muted)] text-[0.9em] select-none'
    marker.setAttribute('aria-hidden', 'true')
    marker.textContent = isBullet ? '•' : `${this.orderedIndex()}.`
    marker.dataset.ordered = String(!isBullet)
    this.markerEl = marker

    this.appendChild(marker)
    this.appendChild(li)
    this.contentEl = li
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.contentEl) {
      if (block.type === 'numberedList' && this.markerEl) {
        this.markerEl.textContent = `${this.orderedIndex()}.`
      }
      InlineRenderer.render(this.contentEl, block.content ?? [])
    }
  }

  /** Returns the 1-based position of this block within its consecutive numbered-list run. */
  private orderedIndex(): number {
    const all = this.ctx.manager.getAll()
    const pos = all.findIndex((b) => b.id === this.block.id)
    if (pos === -1) return 1
    let count = 1
    for (let i = pos - 1; i >= 0; i--) {
      if (all[i].type !== 'numberedList') break
      count++
    }
    return count
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

if (!customElements.get('pila-list')) {
  customElements.define('pila-list', ListBlock)
}
