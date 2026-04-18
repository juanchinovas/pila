import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InlineFormatter } from './InlineFormatter'

// jsdom does not support execCommand / queryCommandState — stub them
beforeEach(() => {
  document.execCommand = vi.fn(() => false)
  document.queryCommandState = vi.fn(() => false)
})

// ─── getActiveMarks ──────────────────────────────────────────────────────────

describe('InlineFormatter.getActiveMarks', () => {
  it('returns all false when there is no selection', () => {
    window.getSelection()!.removeAllRanges()
    const marks = InlineFormatter.getActiveMarks()
    expect(marks).toEqual({ bold: false, italic: false, code: false, underline: false, link: null })
  })

  it('reflects bold state from queryCommandState', () => {
    document.queryCommandState = vi.fn((cmd) => cmd === 'bold')
    const div = document.createElement('div')
    div.textContent = 'hello'
    document.body.appendChild(div)
    const range = document.createRange()
    range.selectNodeContents(div)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)

    const marks = InlineFormatter.getActiveMarks()
    expect(marks.bold).toBe(true)
    expect(marks.italic).toBe(false)

    document.body.removeChild(div)
    document.queryCommandState = vi.fn(() => false)
  })

  it('reflects italic state from queryCommandState', () => {
    document.queryCommandState = vi.fn((cmd) => cmd === 'italic')
    const div = document.createElement('div')
    div.textContent = 'hello'
    document.body.appendChild(div)
    const range = document.createRange()
    range.selectNodeContents(div)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)

    const marks = InlineFormatter.getActiveMarks()
    expect(marks.italic).toBe(true)
    expect(marks.bold).toBe(false)

    document.body.removeChild(div)
    document.queryCommandState = vi.fn(() => false)
  })

  it('detects code mark from <code> ancestor', () => {
    const code = document.createElement('code')
    const text = document.createTextNode('const x = 1')
    code.appendChild(text)
    document.body.appendChild(code)

    const range = document.createRange()
    range.selectNodeContents(code)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)

    const marks = InlineFormatter.getActiveMarks()
    expect(marks.code).toBe(true)

    document.body.removeChild(code)
  })

  it('detects link from <a> ancestor and returns href', () => {
    const a = document.createElement('a')
    a.href = 'https://example.com'
    const text = document.createTextNode('click')
    a.appendChild(text)
    document.body.appendChild(a)

    const range = document.createRange()
    range.selectNodeContents(a)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)

    const marks = InlineFormatter.getActiveMarks()
    expect(marks.link).toBeTruthy()
    expect(marks.link).toContain('example.com')

    document.body.removeChild(a)
  })

  it('reflects underline state from queryCommandState', () => {
    document.queryCommandState = vi.fn((cmd) => cmd === 'underline')
    const div = document.createElement('div')
    div.textContent = 'hello'
    document.body.appendChild(div)
    const range = document.createRange()
    range.selectNodeContents(div)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)

    const marks = InlineFormatter.getActiveMarks()
    expect(marks.underline).toBe(true)

    document.body.removeChild(div)
    document.queryCommandState = vi.fn(() => false)
  })
})

// ─── setLink ──────────────────────────────────────────────────────────────────

describe('InlineFormatter.setLink', () => {
  it('does nothing when there is no selection', () => {
    window.getSelection()!.removeAllRanges()
    // Should not throw
    expect(() => InlineFormatter.setLink('https://example.com', null as never)).not.toThrow()
  })

  it('rejects javascript: URLs (does not insert link)', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    div.textContent = 'click me'
    document.body.appendChild(div)

    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    InlineFormatter.setLink('javascript:alert(1)', null as never)

    // No <a> should have been created
    expect(div.querySelector('a')).toBeNull()

    document.body.removeChild(div)
  })

  it('rejects data: URLs', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    div.textContent = 'click me'
    document.body.appendChild(div)

    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    InlineFormatter.setLink('data:text/html,<h1>hi</h1>', null as never)

    expect(div.querySelector('a')).toBeNull()

    document.body.removeChild(div)
  })

  it('accepts https: URLs and wraps selection in <a>', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    div.textContent = 'click me'
    document.body.appendChild(div)

    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    InlineFormatter.setLink('https://example.com', null as never)

    const a = div.querySelector('a')
    expect(a).not.toBeNull()
    expect(a?.getAttribute('href')).toBe('https://example.com')
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer')

    document.body.removeChild(div)
  })

  it('accepts mailto: URLs', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    div.textContent = 'email'
    document.body.appendChild(div)

    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    InlineFormatter.setLink('mailto:test@example.com', null as never)

    const a = div.querySelector('a')
    expect(a).not.toBeNull()
    expect(a?.getAttribute('href')).toBe('mailto:test@example.com')

    document.body.removeChild(div)
  })
})

// ─── toggleCode ───────────────────────────────────────────────────────────────

describe('InlineFormatter.toggleCode', () => {
  it('does nothing when selection is collapsed', () => {
    const div = document.createElement('div')
    div.textContent = 'hello'
    document.body.appendChild(div)

    const range = document.createRange()
    range.setStart(div.firstChild!, 2)
    range.collapse(true)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    expect(() => InlineFormatter.toggleCode()).not.toThrow()

    document.body.removeChild(div)
  })

  it('wraps selected text in <code> when not already in code', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    div.textContent = 'hello world'
    document.body.appendChild(div)

    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    InlineFormatter.toggleCode()

    expect(div.querySelector('code')).not.toBeNull()

    document.body.removeChild(div)
  })
})
