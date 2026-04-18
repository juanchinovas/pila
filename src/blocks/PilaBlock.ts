import { LitElement, html } from 'lit'
import type { TemplateResult } from 'lit'
import { Block, InlineNode } from '../types'
import { BlockManager } from '../core/BlockManager'
import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'

export interface BlockContext {
  manager: BlockManager
  editorEl: HTMLElement
  placeholder?: string
}

/**
 * Abstract base class for all Pila block web components.
 *
 * Extends LitElement but operates in **light DOM** so Tailwind utility classes
 * from the host page apply normally inside every block.
 *
 * Design notes
 * ─────────────
 * • `block` and `ctx` are plain instance properties (not Lit reactive).
 *   Making `block` reactive would trigger a re-render on every keystroke,
 *   clobbering the caret position. Call `requestRerender()` explicitly when a
 *   structural update (type switch, attrs change) is needed.
 *
 * • `buildDOM()` is abstract and called once from `firstUpdated()`, after
 *   Lit's first render has placed its comment markers in the DOM. Any elements
 *   appended to `this` after that point are outside Lit's managed range and
 *   are never touched by subsequent re-renders. This mirrors the old
 *   `BaseBlock.buildDOM()` contract exactly.
 *
 * • `render()` returns an empty template. Its sole purpose is to allow Lit to
 *   complete its first update cycle and fire `firstUpdated()`.
 *
 * Migration path
 * ──────────────
 * Phase 1: blocks extend `PilaBlock` and keep their existing `buildDOM()`
 *           implementation. They work identically to `BaseBlock`-derived blocks.
 * Phase 2+: individual blocks replace `buildDOM()` with a full Lit `render()`
 *            template using Tailwind classes.
 */
export abstract class PilaBlock extends LitElement {
  // ─── Light DOM ────────────────────────────────────────────────────────────

  /**
   * Return `this` as the render root so there is no shadow root.
   * Tailwind classes defined on the host page penetrate into this element.
   */
  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this as HTMLElement
  }

  // ─── Instance properties (intentionally non-reactive) ────────────────────

  block!: Block
  ctx!: BlockContext

  // ─── Lit lifecycle ────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback()
    // Required by DragHandle which queries `.pila-block[data-block-id]`
    this.classList.add('pila-block')
  }

  /**
   * Default render — empty template.
   * Subclasses that adopt full Lit templates override this.
   * Those that keep `buildDOM()` leave this as-is.
   */
  override render(): TemplateResult {
    return html``
  }

  override firstUpdated(): void {
    this._syncHostAttrs()
    this.buildDOM()
  }

  // ─── Public API (mirrors BaseBlock) ──────────────────────────────────────

  /** The block type this instance was created for. */
  get blockType(): string {
    return this.block?.type ?? ''
  }

  /**
   * Sync new block data without triggering a full Lit re-render.
   * Called by Editor.ts on every `blocks:change` event.
   * Override in individual blocks to additionally update live DOM state
   * (e.g. alignment).
   */
  updateData(newBlock: Block): void {
    this.block = { ...newBlock }
    this._syncHostAttrs()
  }

  /**
   * Trigger a full Lit re-render.
   * Use only for structural changes (type switch, attrs changes that alter
   * the DOM shape), not for content-only changes caused by user typing.
   */
  requestRerender(): void {
    this.requestUpdate()
  }

  abstract getContent(): Block

  /**
   * Move the editing caret into this block.
   * Named `focusBlock` to avoid collision with `HTMLElement.focus(options?)`.
   */
  abstract focusBlock(offset?: number): void

  /**
   * Build the block's inner DOM.
   * Called exactly once, after the first Lit render cycle.
   * Subclasses may replace this with a Lit `render()` template in Phase 2+.
   */
  protected abstract buildDOM(): void

  /** Remove this element from the DOM and clean up. */
  destroy(): void {
    this.remove()
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _syncHostAttrs(): void {
    if (this.block?.id) {
      this.dataset.blockId = this.block.id
    }
    this.style.textAlign = this.block?.attrs?.alignment ?? ''
  }

  // ─── Editing helpers (ported 1:1 from BaseBlock) ─────────────────────────

  /**
   * Creates a contenteditable element pre-filled with inline content.
   * Attaches standard keyboard handlers (Enter = split, Backspace-at-start = merge).
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

    this.ctx.manager.update(this.block.id, { content: before })

    const newBlock = this.ctx.manager.add('paragraph', {
      content: after,
      afterId: this.block.id,
    })

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
    if (range.startOffset !== 0) return

    // Ensure we are at the very first text node
    let node: Node | null = range.startContainer
    while (node && node !== el) {
      if (node.previousSibling) return
      node = node.parentNode
    }

    e.preventDefault()

    const allBlocks = this.ctx.manager.getAll()
    const idx = allBlocks.findIndex((b) => b.id === this.block.id)
    if (idx <= 0) return

    const prevBlock = allBlocks[idx - 1]
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

  /** Hook for subclasses — called on every `input` event of a managed element. */
  protected onInput(_el: HTMLElement): void {
    // Subclasses override for live state sync
  }

  /** Split inline content at the current caret position. */
  protected splitAtCaret(el: HTMLElement): { before: InlineNode[]; after: InlineNode[] } {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return { before: InlineParser.parse(el), after: [] }

    const range = sel.getRangeAt(0)
    const fullText = el.textContent ?? ''

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
        before.push({ ...node, text: node.text.slice(0, offset - start) })
        const afterText = node.text.slice(offset - start)
        if (afterText) after.push({ ...node, text: afterText })
      }
      cursor = end
    }

    if (allNodes.length === 0) {
      before.push({ text: fullText.slice(0, offset) })
      const afterStr = fullText.slice(offset)
      if (afterStr) after.push({ text: afterStr })
    }

    return { before, after }
  }

  /** Place the caret at a character offset within a contenteditable element. */
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
