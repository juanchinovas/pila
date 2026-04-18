import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block, BlockType } from '../types'
import { PilaBlock } from './PilaBlock'

const LEVEL_MAP: Partial<Record<BlockType, 1 | 2 | 3>> = {
  heading1: 1,
  heading2: 2,
  heading3: 3,
}

const HEADING_SIZE_CLASSES: Record<1 | 2 | 3, string> = {
  1: 'text-[2em] mt-[1.4em]',
  2: 'text-[1.5em] mt-[1.1em]',
  3: 'text-[1.25em] mt-[0.9em]',
}

export class HeadingBlock extends PilaBlock {
  private contentEl!: HTMLElement

  protected buildDOM(): void {
    const level = (LEVEL_MAP[this.block.type] ?? 1) as 1 | 2 | 3
    this.contentEl = this.makeContentEditable(
      `h${level}`,
      this.block.content ?? [],
      `m-0 px-0.5 py-[3px] outline-none font-bold leading-tight tracking-tight ${HEADING_SIZE_CLASSES[level]}`
    )
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

if (!customElements.get('pila-heading')) {
  customElements.define('pila-heading', HeadingBlock)
}
