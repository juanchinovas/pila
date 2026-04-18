import { Block, InlineNode } from '../types'
import { BlockManager } from '../core/BlockManager'
import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'

export interface BlockContext {
  manager: BlockManager
  editorEl: HTMLElement
  placeholder?: string
}

export abstract class BaseBlock {
  protected block: Block
  protected ctx: BlockContext
  protected wrapper!: HTMLElement
  protected _rendered = false

  constructor(block: Block, ctx: BlockContext) {
    this.block = { ...block }
    this.ctx = ctx
  }

  /** The BlockType this instance was created for — used to detect type changes. */
  get blockType(): string {
    return this.block.type
  }

  /** Returns (and caches) the outer wrapper element. */
  render(): HTMLElement {
    if (!this._rendered) {
      this.wrapper = this.createWrapper()
      this.buildDOM()
      this._rendered = true
    }
    return this.wrapper
  }

  /** Called when block data changes externally (e.g. type switch). */
  updateData(block: Block): void {
    this.block = { ...block }
    if (this.wrapper) {
      this.wrapper.style.textAlign = block.attrs?.alignment ?? ''
    }
  }

  /** Returns current block state (flushing live DOM if applicable). */
  abstract getContent(): Block

  /** Move focus into this block. */
  abstract focus(offset?: number): void

  /** Clean up event listeners / DOM references. */
  destroy(): void {
    this.wrapper?.remove()
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  protected createWrapper(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'pila-block'
    if (this.block.attrs?.alignment) {
      div.style.textAlign = this.block.attrs.alignment
    }
    return div
  }

  protected abstract buildDOM(): void

  /**
   * Creates a contenteditable element pre-filled with inline content.
   * Attaches the standard keyboard handlers (Enter = split, Backspace-at-start = merge).
   */
  protected makeContentEditable(
    tag: string,
    inlineNodes: InlineNode[],
    extraClass = ''
  ): HTMLElement {
    const el = document.createElement(tag)
    el.setAttribute('contenteditable', 'true')
    el.setAttribute('spellcheck', 'true')
    if (extraClass) el.className = extraClass
    el.setAttribute('data-block-id', this.block.id)

    // Render inline content
    InlineRenderer.render(el, inlineNodes)

    el.addEventListener('keydown', (e) => this.handleKeyDown(e))
    el.addEventListener('input', () => this.onInput(el))

    return el
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this.handleEnter(e.currentTarget as HTMLElement)
    } else if (e.key === 'Backspace') {
      this.handleBackspace(e.currentTarget as HTMLElement, e)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.handleArrow(e)
    }
  }

  protected handleEnter(el: HTMLElement): void {
    const { before, after } = this.splitAtCaret(el)

    // Update current block with 'before' content
    this.ctx.manager.update(this.block.id, { content: before })

    // Add new paragraph after with 'after' content
    const newBlock = this.ctx.manager.add('paragraph', {
      content: after,
      afterId: this.block.id,
    })

    // Focus new block
    requestAnimationFrame(() => {
      const newEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id}"] [contenteditable]`
      ) as HTMLElement | null
      if (newEl) {
        newEl.focus()
        const range = document.createRange()
        range.setStart(newEl, 0)
        range.collapse(true)
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
    })
  }

  protected handleBackspace(el: HTMLElement, e: KeyboardEvent): void {
    const sel = window.getSelection()
    if (!sel || !sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    // Only merge when caret is at the very beginning of the block
    if (range.startOffset !== 0) return
    // Check we're at the first text node
    let node: Node | null = range.startContainer
    while (node && node !== el) {
      if (node.previousSibling) return // Not at the very start
      node = node.parentNode
    }

    e.preventDefault()

    const allBlocks = this.ctx.manager.getAll()
    const idx = allBlocks.findIndex((b) => b.id === this.block.id)
    if (idx <= 0) return

    const prevBlock = allBlocks[idx - 1]
    // Only merge text blocks
    if (!prevBlock.content) {
      this.ctx.manager.delete(this.block.id)
      return
    }

    const currentNodes = InlineParser.parse(el)
    const mergedContent = [...(prevBlock.content ?? []), ...currentNodes]
    const mergeOffset = (prevBlock.content ?? []).reduce((s, n) => s + n.text.length, 0)

    this.ctx.manager.update(prevBlock.id, { content: mergedContent })
    this.ctx.manager.delete(this.block.id)

    requestAnimationFrame(() => {
      const prevEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${prevBlock.id}"] [contenteditable]`
      ) as HTMLElement | null
      if (prevEl) {
        prevEl.focus()
        this.setCaret(prevEl, mergeOffset)
      }
    })
  }

  protected handleArrow(e: KeyboardEvent): void {
    const allBlocks = this.ctx.manager.getAll()
    const idx = allBlocks.findIndex((b) => b.id === this.block.id)

    if (e.key === 'ArrowUp' && idx > 0) {
      const targetId = allBlocks[idx - 1].id
      const targetEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${targetId}"] [contenteditable]`
      ) as HTMLElement | null
      if (targetEl) {
        e.preventDefault()
        targetEl.focus()
      }
    } else if (e.key === 'ArrowDown' && idx < allBlocks.length - 1) {
      const targetId = allBlocks[idx + 1].id
      const targetEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${targetId}"] [contenteditable]`
      ) as HTMLElement | null
      if (targetEl) {
        e.preventDefault()
        targetEl.focus()
      }
    }
  }

  protected onInput(_el: HTMLElement): void {
    // Subclasses can override for live state sync
  }

  /** Split inline content at the current caret position. */
  private splitAtCaret(el: HTMLElement): {
    before: InlineNode[]
    after: InlineNode[]
  } {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return { before: InlineParser.parse(el), after: [] }

    const range = sel.getRangeAt(0)
    const fullText = el.textContent ?? ''

    // Character offset from start of el to caret
    const preCaret = document.createRange()
    preCaret.setStart(el, 0)
    preCaret.setEnd(range.startContainer, range.startOffset)
    const offset = preCaret.toString().length

    const allNodes = InlineParser.parse(el)
    let cursor = 0
    const before: InlineNode[] = []
    const after: InlineNode[] = []

    for (const node of allNodes) {
      const start = cursor
      const end = cursor + node.text.length
      if (end <= offset) {
        before.push(node)
      } else if (start >= offset) {
        after.push(node)
      } else {
        // Split this node
        before.push({ ...node, text: node.text.slice(0, offset - start) })
        const afterText = node.text.slice(offset - start)
        if (afterText) after.push({ ...node, text: afterText })
      }
      cursor = end
    }

    // Handle plain text not returned by InlineParser
    if (allNodes.length === 0) {
      before.push({ text: fullText.slice(0, offset) })
      const afterStr = fullText.slice(offset)
      if (afterStr) after.push({ text: afterStr })
    }

    return { before, after }
  }

  /** Place caret at a character offset within a contenteditable element. */
  protected setCaret(el: HTMLElement, charOffset: number): void {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let remaining = charOffset
    let textNode: Text | null = null

    while (walker.nextNode()) {
      const n = walker.currentNode as Text
      if (remaining <= n.length) {
        textNode = n
        break
      }
      remaining -= n.length
    }

    const sel = window.getSelection()
    if (!sel) return

    const range = document.createRange()
    if (textNode) {
      range.setStart(textNode, remaining)
    } else {
      range.setStart(el, el.childNodes.length)
    }
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
