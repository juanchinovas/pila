import { describe, it, expect } from 'vitest'
import { HtmlSerializer } from './HtmlSerializer'
import { Block } from '../types'

describe('HtmlSerializer', () => {
  it('serializes paragraph', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'hello' }] },
    ])
    expect(html).toBe('<p>hello</p>')
  })

  it('serializes headings h1–h3', () => {
    expect(HtmlSerializer.serialize([{ id: '1', type: 'heading1', content: [{ text: 'H1' }] }])).toContain('<h1>')
    expect(HtmlSerializer.serialize([{ id: '2', type: 'heading2', content: [{ text: 'H2' }] }])).toContain('<h2>')
    expect(HtmlSerializer.serialize([{ id: '3', type: 'heading3', content: [{ text: 'H3' }] }])).toContain('<h3>')
  })

  it('serializes bullet list', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'bulletList', content: [{ text: 'item' }] },
    ])
    expect(html).toBe('<ul><li>item</li></ul>')
  })

  it('serializes numbered list', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'numberedList', content: [{ text: 'one' }] },
    ])
    expect(html).toBe('<ol><li>one</li></ol>')
  })

  it('serializes unchecked todo', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'task' }], attrs: { checked: false } },
    ])
    expect(html).toContain('type="checkbox"')
    expect(html).not.toContain('checked')
  })

  it('serializes checked todo', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'done' }], attrs: { checked: true } },
    ])
    expect(html).toContain(' checked')
  })

  it('serializes code block with language class', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'code', content: [{ text: 'const x = 1' }], attrs: { language: 'typescript' } },
    ])
    expect(html).toContain('class="language-typescript"')
    expect(html).toContain('const x = 1')
  })

  it('escapes HTML entities in code block', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'code', content: [{ text: '<script>' }] },
    ])
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('serializes quote', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'quote', content: [{ text: 'wise words' }] },
    ])
    expect(html).toBe('<blockquote>wise words</blockquote>')
  })

  it('serializes callout', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'callout', content: [{ text: 'note' }], attrs: { icon: '📝' } },
    ])
    expect(html).toContain('📝')
    expect(html).toContain('note')
  })

  it('serializes divider', () => {
    expect(HtmlSerializer.serialize([{ id: '1', type: 'divider' }])).toBe('<hr />')
  })

  it('serializes image with safe src', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: 'a pic' } },
    ])
    expect(html).toContain('src="https://example.com/img.png"')
    expect(html).toContain('alt="a pic"')
  })

  it('blocks unsafe javascript: src', () => {
    // eslint-disable-next-line no-script-url
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'javascript:alert(1)', alt: '' } },
    ])
    expect(html).toContain('src="#"')
    expect(html).not.toContain('javascript:')
  })

  it('escapes attribute values', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://x.com', alt: '"quoted"' } },
    ])
    expect(html).toContain('&quot;quoted&quot;')
  })

  it('serializes inline bold/italic/code in paragraph', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [
          { text: 'Hello ', bold: false },
          { text: 'bold', bold: true },
          { text: ' and ', italic: false },
          { text: 'italic', italic: true },
        ],
      },
    ])
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('serializes inline links with safe href', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [{ text: 'click', link: 'https://example.com' }],
      },
    ])
    expect(html).toContain('href="https://example.com"')
  })

  it('blocks javascript: link in inline content', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        // eslint-disable-next-line no-script-url
        content: [{ text: 'evil', link: 'javascript:alert(1)' }],
      },
    ])
    expect(html).toContain('href="#"')
    expect(html).not.toContain('javascript:')
  })

  it('serializes table', () => {
    const blocks: Block[] = [
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          rows: [
            { cells: [{ content: [{ text: 'Name' }] }, { content: [{ text: 'Age' }] }] },
            { cells: [{ content: [{ text: 'Alice' }] }, { content: [{ text: '30' }] }] },
          ],
        },
      },
    ]
    const html = HtmlSerializer.serialize(blocks)
    expect(html).toContain('<table>')
    expect(html).toContain('<th>')
    expect(html).toContain('<td>')
    expect(html).toContain('Alice')
  })

  // ── Phase 5: image new attrs ──────────────────────────────────────────────

  it('serializes image with width and height attributes', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'image',
        attrs: { src: 'https://example.com/img.png', alt: '', width: '400px', height: '200px' },
      },
    ])
    expect(html).toContain('width="400px"')
    expect(html).toContain('height="200px"')
  })

  it('omits width/height attributes when not set', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: '' } },
    ])
    expect(html).not.toContain('width=')
    expect(html).not.toContain('height=')
  })

  it('serializes image with tailwindClasses as class attribute', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'image',
        attrs: { src: 'https://example.com/img.png', alt: '', tailwindClasses: 'rounded-lg shadow-md' },
      },
    ])
    expect(html).toContain('class="rounded-lg shadow-md"')
  })

  it('omits class attribute when tailwindClasses is not set', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: '' } },
    ])
    expect(html).not.toContain('class=')
  })

  it('escapes tailwindClasses in class attribute', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'image',
        attrs: { src: 'https://example.com/img.png', alt: '', tailwindClasses: 'w-1/2"' },
      },
    ])
    expect(html).toContain('&quot;')
    expect(html).not.toContain('w-1/2"')
  })

  // ── Phase 5: table structure ──────────────────────────────────────────────

  it('serializes table without headerRow as plain rows (no thead/tbody)', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          rows: [
            { cells: [{ content: [{ text: 'A' }] }, { content: [{ text: 'B' }] }] },
          ],
        },
      },
    ])
    expect(html).not.toContain('<thead>')
    expect(html).not.toContain('<tbody>')
    expect(html).toContain('<td>')
    expect(html).not.toContain('<th>')
  })

  it('serializes table with headerRow using thead/tbody', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          rows: [
            { cells: [{ content: [{ text: 'Header' }] }] },
            { cells: [{ content: [{ text: 'Body' }] }] },
          ],
        },
      },
    ])
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
    expect(html).toContain('<th>Header</th>')
    expect(html).toContain('<td>Body</td>')
  })

  it('serializes table with headerRow but no body rows (thead only)', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          rows: [{ cells: [{ content: [{ text: 'Only Row' }] }] }],
        },
      },
    ])
    expect(html).toContain('<thead>')
    expect(html).not.toContain('<tbody>')
  })

  it('serializes table with headerCol — first cell of each row is <th>', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerCol: true,
          rows: [
            { cells: [{ content: [{ text: 'Label' }] }, { content: [{ text: 'Value' }] }] },
          ],
        },
      },
    ])
    expect(html).toContain('<th>Label</th>')
    expect(html).toContain('<td>Value</td>')
  })

  it('serializes table with both headerRow and headerCol', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          headerCol: true,
          rows: [
            { cells: [{ content: [{ text: 'R0C0' }] }, { content: [{ text: 'R0C1' }] }] },
            { cells: [{ content: [{ text: 'R1C0' }] }, { content: [{ text: 'R1C1' }] }] },
          ],
        },
      },
    ])
    // header row: all cells are <th>
    expect(html).toContain('<th>R0C0</th>')
    expect(html).toContain('<th>R0C1</th>')
    // body row: first cell is <th> (headerCol), second is <td>
    expect(html).toContain('<th>R1C0</th>')
    expect(html).toContain('<td>R1C1</td>')
  })

  it('serializes table cell with align attribute', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          rows: [
            {
              cells: [
                { content: [{ text: 'Left' }], align: 'left' },
                { content: [{ text: 'Center' }], align: 'center' },
                { content: [{ text: 'Right' }], align: 'right' },
                { content: [{ text: 'None' }] },
              ],
            },
          ],
        },
      },
    ])
    expect(html).toContain('align="left"')
    expect(html).toContain('align="center"')
    expect(html).toContain('align="right"')
    // cell without align should not have align attribute
    expect(html).toContain('<td>None</td>')
  })

  it('serializes empty table as empty <table>', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'table', attrs: { rows: [] } },
    ])
    expect(html).toBe('<table>\n\n</table>')
  })

  // ── Button block ─────────────────────────────────────────────────────────

  it('serializes button with href and label', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Click me' }], attrs: { href: 'https://example.com' } },
    ])
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('Click me')
    expect(html).toContain('pila-button')
  })

  it('button defaults to primary style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com' } },
    ])
    expect(html).toContain('pila-button--primary')
  })

  it('button respects secondary style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', buttonStyle: 'secondary' } },
    ])
    expect(html).toContain('pila-button--secondary')
  })

  it('button respects outline style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', buttonStyle: 'outline' } },
    ])
    expect(html).toContain('pila-button--outline')
  })

  it('button falls back to # when no href', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }] },
    ])
    expect(html).toContain('href="#"')
  })

  it('button blocks javascript: href', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'javascript:alert(1)' } },
    ])
    expect(html).toContain('href="#"')
    expect(html).not.toContain('javascript:')
  })

  it('button opens in new tab with rel=noopener', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com' } },
    ])
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('button respects alignment', () => {
    const centerHtml = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', alignment: 'center' } },
    ])
    expect(centerHtml).toContain('text-align:center')

    const rightHtml = HtmlSerializer.serialize([
      { id: '2', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', alignment: 'right' } },
    ])
    expect(rightHtml).toContain('text-align:right')
  })
})
