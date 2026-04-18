import { describe, it, expect, beforeEach } from 'vitest'
import { InlineParser } from './InlineParser'

describe('InlineParser', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = document.createElement('div')
  })

  it('parses plain text', () => {
    el.textContent = 'hello world'
    const result = InlineParser.parse(el)
    expect(result).toEqual([{ text: 'hello world' }])
  })

  it('parses bold', () => {
    el.innerHTML = '<strong>bold</strong>'
    const result = InlineParser.parse(el)
    expect(result).toEqual([{ text: 'bold', bold: true }])
  })

  it('parses italic', () => {
    el.innerHTML = '<em>italic</em>'
    const result = InlineParser.parse(el)
    expect(result).toEqual([{ text: 'italic', italic: true }])
  })

  it('parses code', () => {
    el.innerHTML = '<code>const x = 1</code>'
    const result = InlineParser.parse(el)
    expect(result).toEqual([{ text: 'const x = 1', code: true }])
  })

  it('parses underline', () => {
    el.innerHTML = '<u>underlined</u>'
    const result = InlineParser.parse(el)
    expect(result).toEqual([{ text: 'underlined', underline: true }])
  })

  it('parses a link', () => {
    el.innerHTML = '<a href="https://example.com">link</a>'
    const result = InlineParser.parse(el)
    expect(result[0].link).toBe('https://example.com')
    expect(result[0].text).toBe('link')
  })

  it('parses nested marks (bold inside em)', () => {
    el.innerHTML = '<em><strong>both</strong></em>'
    const result = InlineParser.parse(el)
    expect(result).toEqual([{ text: 'both', italic: true, bold: true }])
  })

  it('parses mixed text nodes', () => {
    el.innerHTML = 'plain <strong>bold</strong> end'
    const result = InlineParser.parse(el)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ text: 'plain ' })
    expect(result[1]).toEqual({ text: 'bold', bold: true })
    expect(result[2]).toEqual({ text: ' end' })
  })

  it('returns empty array for empty element', () => {
    expect(InlineParser.parse(el)).toEqual([])
  })

  it('handles <b> and <i> aliases', () => {
    el.innerHTML = '<b>B</b><i>I</i>'
    const result = InlineParser.parse(el)
    expect(result[0].bold).toBe(true)
    expect(result[1].italic).toBe(true)
  })

  it('handles <br> as newline', () => {
    el.innerHTML = 'line1<br>line2'
    const result = InlineParser.parse(el)
    expect(result.some((n) => n.text === '\n')).toBe(true)
  })
})
