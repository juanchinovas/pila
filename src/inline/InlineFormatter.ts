import { BlockManager } from '../core/BlockManager'
import { InlineParser } from './InlineParser'

/**
 * Toggles inline marks on the current selection within a contenteditable element.
 * Works by inspecting live DOM nodes via Selection API.
 */
export class InlineFormatter {
  static toggleBold(): void {
    document.execCommand('bold')
  }

  static toggleItalic(): void {
    document.execCommand('italic')
  }

  static toggleCode(): void {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    const selectedText = range.toString()
    if (!selectedText) return

    // Check if already wrapped in code
    const ancestor = range.commonAncestorContainer
    const inCode =
      ancestor.nodeType === Node.ELEMENT_NODE
        ? (ancestor as Element).closest('code') !== null
        : ancestor.parentElement?.closest('code') !== null

    if (inCode) {
      document.execCommand('removeFormat')
    } else {
      range.surroundContents(document.createElement('code'))
    }
  }

  static toggleUnderline(): void {
    document.execCommand('underline')
  }

  static setLink(url: string, _manager: BlockManager): void {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    const ancestor = range.commonAncestorContainer
    const existingLink =
      ancestor.nodeType === Node.ELEMENT_NODE
        ? (ancestor as Element).closest('a')
        : ancestor.parentElement?.closest('a')

    if (existingLink) {
      // Unwrap existing link
      const parent = existingLink.parentNode
      if (parent) {
        while (existingLink.firstChild) {
          parent.insertBefore(existingLink.firstChild, existingLink)
        }
        parent.removeChild(existingLink)
      }
    }

    if (url) {
      const a = document.createElement('a')
      // Validate: only http/https/mailto links
      if (!/^(https?:\/\/|mailto:)/i.test(url)) return
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      try {
        range.surroundContents(a)
      } catch {
        // If range spans multiple elements, wrap selected text in a new node
        const fragment = range.extractContents()
        a.appendChild(fragment)
        range.insertNode(a)
      }
    }
  }

  /** Returns active marks for the current caret/selection position. */
  static getActiveMarks(): {
    bold: boolean
    italic: boolean
    code: boolean
    underline: boolean
    link: string | null
  } {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) {
      return { bold: false, italic: false, code: false, underline: false, link: null }
    }

    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    const el =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as Element)
        : container.parentElement

    return {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      code: el?.closest('code') !== null,
      underline: document.queryCommandState('underline'),
      link: el?.closest('a')?.getAttribute('href') ?? null,
    }
  }

  /** Flush live DOM state back to BlockManager after formatting. */
  static flushBlock(blockId: string, manager: BlockManager, editorEl: HTMLElement): void {
    const contentEl = editorEl.querySelector(
      `[data-block-id="${blockId}"] [contenteditable]`
    ) as HTMLElement | null
    if (!contentEl) return
    const parsed = InlineParser.parse(contentEl)
    manager.update(blockId, { content: parsed })
  }
}
