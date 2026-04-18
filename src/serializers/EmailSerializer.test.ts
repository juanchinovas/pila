import { describe, it, expect } from 'vitest'
import { EmailSerializer } from './EmailSerializer'
import type { Block } from '../types'

function serialize(blocks: Block[]): string {
  return EmailSerializer.serialize(blocks)
}

describe('EmailSerializer', () => {
  // ─── Document shell ────────────────────────────────────────────────────────

  it('produces a complete HTML document', () => {
    const html = serialize([])
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('</html>')
    expect(html).toContain('<body')
    expect(html).toContain('</body>')
  })

  it('includes Outlook conditional comments', () => {
    const html = serialize([])
    expect(html).toContain('<!--[if mso]>')
    expect(html).toContain('<![endif]-->')
  })

  // ─── Inline marks ──────────────────────────────────────────────────────────

  it('renders bold with inline style', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'hi', bold: true }] }])
    expect(html).toContain('<strong style="font-weight:700;">hi</strong>')
  })

  it('renders italic with inline style', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'hi', italic: true }] }])
    expect(html).toContain('<em style="font-style:italic;">hi</em>')
  })

  it('renders code span with inline style', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'x', code: true }] }])
    expect(html).toContain('<code style=')
    expect(html).toContain('x</code>')
  })

  it('renders underline with inline style', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'u', underline: true }] }])
    expect(html).toContain('<u style="text-decoration:underline;">u</u>')
  })

  it('renders links with safe href and rel attribute', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'link', link: 'https://example.com' }] }])
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('blocks javascript: links', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'bad', link: 'javascript:alert(1)' }] }])
    expect(html).toContain('href="#"')
    expect(html).not.toContain('javascript:')
  })

  // ─── Block types ───────────────────────────────────────────────────────────

  it('serializes paragraph', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }])
    expect(html).toContain('<p style=')
    expect(html).toContain('hello</p>')
  })

  it('empty paragraph renders &nbsp; to prevent collapse', () => {
    const html = serialize([{ id: '1', type: 'paragraph', content: [] }])
    expect(html).toContain('&nbsp;')
  })

  it.each(['heading1', 'heading2', 'heading3'] as const)(
    'serializes %s with inline style',
    (type) => {
      const tag = { heading1: 'h1', heading2: 'h2', heading3: 'h3' }[type]
      const html = serialize([{ id: '1', type, content: [{ text: 'Title' }] }])
      expect(html).toContain(`<${tag} style=`)
      expect(html).toContain(`Title</${tag}>`)
    },
  )

  it('serializes bulletList', () => {
    const html = serialize([{ id: '1', type: 'bulletList', content: [{ text: 'item' }] }])
    expect(html).toContain('<ul style=')
    expect(html).toContain('<li style=')
    expect(html).toContain('item</li>')
  })

  it('serializes numberedList', () => {
    const html = serialize([{ id: '1', type: 'numberedList', content: [{ text: 'item' }] }])
    expect(html).toContain('<ol style=')
  })

  it('renders unchecked todo with ☐ character', () => {
    const html = serialize([{ id: '1', type: 'todo', content: [{ text: 'buy milk' }], attrs: { checked: false } }])
    expect(html).toContain('&#x2610;')
    expect(html).not.toContain('&#x2611;')
    expect(html).not.toContain('<input')
  })

  it('renders checked todo with ☑ and strikethrough', () => {
    const html = serialize([{ id: '1', type: 'todo', content: [{ text: 'done' }], attrs: { checked: true } }])
    expect(html).toContain('&#x2611;')
    expect(html).toContain('line-through')
    expect(html).not.toContain('<input')
  })

  it('serializes code block with language label and dark background', () => {
    const html = serialize([{
      id: '1', type: 'code',
      content: [{ text: 'const x = 1' }],
      attrs: { language: 'javascript' },
    }])
    expect(html).toContain('javascript')
    expect(html).toContain('const x = 1')
    expect(html).toContain('#1e1e1e')
    expect(html).not.toContain('<class=')
  })

  it('serializes blockquote with border-left style', () => {
    const html = serialize([{ id: '1', type: 'quote', content: [{ text: 'wise words' }] }])
    expect(html).toContain('<blockquote style=')
    expect(html).toContain('border-left:4px solid')
    expect(html).toContain('wise words')
  })

  it('serializes callout with default info theme', () => {
    const html = serialize([{ id: '1', type: 'callout', content: [{ text: 'note' }], attrs: { flavor: 'info', icon: '💡' } }])
    expect(html).toContain('#3b82f6')
    expect(html).toContain('#eff6ff')
    expect(html).toContain('💡')
  })

  it.each(['warning', 'error', 'success', 'tip'] as const)(
    'callout flavor %s uses correct border colour',
    (flavor) => {
      const colours = { warning: '#f59e0b', error: '#ef4444', success: '#22c55e', tip: '#8b5cf6' }
      const html = serialize([{ id: '1', type: 'callout', content: [{ text: 'x' }], attrs: { flavor } }])
      expect(html).toContain(colours[flavor])
    },
  )

  it('serializes callout using table layout (no flex)', () => {
    const html = serialize([{ id: '1', type: 'callout', content: [{ text: 'x' }] }])
    expect(html).toContain('<table role="presentation"')
    expect(html).not.toContain('display:flex')
  })

  it('serializes divider as <hr> with inline style', () => {
    const html = serialize([{ id: '1', type: 'divider' }])
    expect(html).toContain('<hr style=')
  })

  it('serializes image', () => {
    const html = serialize([{ id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: 'demo' } }])
    expect(html).toContain('<img')
    expect(html).toContain('src="https://example.com/img.png"')
    expect(html).toContain('alt="demo"')
  })

  it('blocks javascript: image src', () => {
    const html = serialize([{ id: '1', type: 'image', attrs: { src: 'javascript:alert(1)', alt: '' } }])
    expect(html).toContain('src="#"')
    expect(html).not.toContain('javascript:')
  })

  // ─── Table ─────────────────────────────────────────────────────────────────

  it('serializes table with inline styles on th/td', () => {
    const html = serialize([{
      id: '1', type: 'table',
      attrs: {
        headerRow: true,
        rows: [
          { cells: [{ content: [{ text: 'Name' }] }, { content: [{ text: 'Age' }] }] },
          { cells: [{ content: [{ text: 'Alice' }] }, { content: [{ text: '30' }] }] },
        ],
      },
    }])
    expect(html).toContain('<table style=')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
    expect(html).toContain('<th style=')
    expect(html).toContain('<td style=')
    expect(html).toContain('Name')
    expect(html).toContain('Alice')
  })

  // ─── Columns → table layout ────────────────────────────────────────────────

  it('serializes columns as table-based layout (no flex/grid)', () => {
    const html = serialize([{
      id: '1', type: 'columns',
      attrs: {
        columnDefs: [
          { width: 1, blocks: [{ id: 'a', type: 'paragraph', content: [{ text: 'Left' }] }] },
          { width: 1, blocks: [{ id: 'b', type: 'paragraph', content: [{ text: 'Right' }] }] },
        ],
      },
    }])
    expect(html).toContain('<table role="presentation"')
    expect(html).toContain('<td valign="top"')
    expect(html).toContain('width:50%')
    expect(html).toContain('Left')
    expect(html).toContain('Right')
    expect(html).not.toContain('display:flex')
    expect(html).not.toContain('display:grid')
  })

  it('respects custom column width ratios', () => {
    const html = serialize([{
      id: '1', type: 'columns',
      attrs: {
        columnDefs: [
          { width: 2, blocks: [{ id: 'a', type: 'paragraph', content: [{ text: 'Wide' }] }] },
          { width: 1, blocks: [{ id: 'b', type: 'paragraph', content: [{ text: 'Narrow' }] }] },
        ],
      },
    }])
    expect(html).toContain('width:67%')
    expect(html).toContain('width:33%')
  })

  // ─── HTML escaping ─────────────────────────────────────────────────────────

  it('escapes special characters in text content', () => {
    const html = serialize([{
      id: '1', type: 'paragraph',
      content: [{ text: '<script>alert("xss")</script>' }],
    }])
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
