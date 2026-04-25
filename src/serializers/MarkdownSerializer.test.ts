import { describe, it, expect } from 'vitest'
import { MarkdownSerializer } from './MarkdownSerializer'
import { Block } from '../types'

describe('MarkdownSerializer', () => {
  it('serializes paragraph', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }])).toBe('hello')
  })

  it('serializes heading1', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'heading1', content: [{ text: 'Title' }] }])).toBe('# Title')
  })

  it('serializes heading2', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'heading2', content: [{ text: 'Sub' }] }])).toBe('## Sub')
  })

  it('serializes heading3', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'heading3', content: [{ text: 'Sub' }] }])).toBe('### Sub')
  })

  it('serializes bullet list', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'bulletList', content: [{ text: 'item' }] }])).toBe('- item')
  })

  it('serializes numbered list', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'numberedList', content: [{ text: 'first' }] }])).toBe('1. first')
  })

  it('serializes unchecked todo', () => {
    expect(MarkdownSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'task' }], attrs: { checked: false } },
    ])).toBe('- [ ] task')
  })

  it('serializes checked todo', () => {
    expect(MarkdownSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'done' }], attrs: { checked: true } },
    ])).toBe('- [x] done')
  })

  it('serializes code block with language', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'code', content: [{ text: 'const x = 1' }], attrs: { language: 'ts' } },
    ])
    expect(md).toBe('```ts\nconst x = 1\n```')
  })

  it('serializes quote', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'quote', content: [{ text: 'wise' }] }])).toBe('> wise')
  })

  it('serializes callout with icon', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'callout', content: [{ text: 'note' }], attrs: { icon: '💡' } },
    ])
    expect(md).toBe('> 💡 note')
  })

  it('serializes divider', () => {
    expect(MarkdownSerializer.serialize([{ id: '1', type: 'divider' }])).toBe('---')
  })

  it('serializes image', () => {
    expect(MarkdownSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://x.com/img.png', alt: 'pic' } },
    ])).toBe('![pic](https://x.com/img.png)')
  })

  it('serializes a table with header separator', () => {
    const blocks: Block[] = [
      {
        id: '1',
        type: 'table',
        attrs: {
          rows: [
            { cells: [{ content: [{ text: 'Name' }] }, { content: [{ text: 'Age' }] }] },
            { cells: [{ content: [{ text: 'Alice' }] }, { content: [{ text: '30' }] }] },
          ],
        },
      },
    ]
    const md = MarkdownSerializer.serialize(blocks)
    expect(md).toContain('| Name | Age |')
    expect(md).toContain('| --- | --- |')
    expect(md).toContain('| Alice | 30 |')
  })

  it('renders inline bold as **text**', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'bold', bold: true }] },
    ])
    expect(md).toBe('**bold**')
  })

  it('renders inline italic as _text_', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'ital', italic: true }] },
    ])
    expect(md).toBe('_ital_')
  })

  it('renders inline code as `text`', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'x++', code: true }] },
    ])
    expect(md).toBe('`x++`')
  })

  it('renders inline link as [text](url)', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'click', link: 'https://x.com' }] },
    ])
    expect(md).toBe('[click](https://x.com)')
  })

  it('joins multiple blocks with double newlines', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'A' }] },
      { id: '2', type: 'paragraph', content: [{ text: 'B' }] },
    ])
    expect(md).toBe('A\n\nB')
  })

  // ── Button block ────────────────────────────────────────────────────────

  it('serializes button as a markdown link', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Click me' }], attrs: { href: 'https://example.com' } },
    ])
    expect(md).toBe('[Click me](https://example.com)')
  })

  it('button falls back to # when no href', () => {
    const md = MarkdownSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }] },
    ])
    expect(md).toBe('[Go](#)')
  })
})
