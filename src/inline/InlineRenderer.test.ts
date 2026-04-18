import { describe, it, expect, beforeEach } from 'vitest'
import { InlineRenderer } from './InlineRenderer'
import { InlineNode } from '../types'

describe('InlineRenderer', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = document.createElement('div')
  })

  it('clears previous content before rendering', () => {
    el.innerHTML = '<span>old</span>'
    InlineRenderer.render(el, [{ text: 'new' }])
    expect(el.textContent).toBe('new')
  })

  it('renders plain text', () => {
    InlineRenderer.render(el, [{ text: 'hello' }])
    expect(el.textContent).toBe('hello')
    expect(el.childNodes[0].nodeType).toBe(Node.TEXT_NODE)
  })

  it('renders bold', () => {
    InlineRenderer.render(el, [{ text: 'bold', bold: true }])
    expect(el.querySelector('strong')).not.toBeNull()
    expect(el.querySelector('strong')!.textContent).toBe('bold')
  })

  it('renders italic', () => {
    InlineRenderer.render(el, [{ text: 'ital', italic: true }])
    expect(el.querySelector('em')).not.toBeNull()
  })

  it('renders code', () => {
    InlineRenderer.render(el, [{ text: 'x++', code: true }])
    expect(el.querySelector('code')).not.toBeNull()
  })

  it('renders underline', () => {
    InlineRenderer.render(el, [{ text: 'u', underline: true }])
    expect(el.querySelector('u')).not.toBeNull()
  })

  it('renders a link with safe attributes', () => {
    InlineRenderer.render(el, [{ text: 'click', link: 'https://example.com' }])
    const a = el.querySelector('a') as HTMLAnchorElement
    expect(a).not.toBeNull()
    expect(a.href).toBe('https://example.com/')
    expect(a.rel).toContain('noopener')
    expect(a.target).toBe('_blank')
  })

  it('renders nested marks with correct nesting order (code inside bold)', () => {
    InlineRenderer.render(el, [{ text: 'x', bold: true, code: true }])
    // code wraps text first, then bold wraps code
    const strong = el.querySelector('strong')
    expect(strong).not.toBeNull()
    expect(strong!.querySelector('code')).not.toBeNull()
  })

  it('renders multiple nodes in sequence', () => {
    const nodes: InlineNode[] = [
      { text: 'Hello ' },
      { text: 'world', bold: true },
      { text: '!' },
    ]
    InlineRenderer.render(el, nodes)
    expect(el.textContent).toBe('Hello world!')
    expect(el.querySelectorAll('strong')).toHaveLength(1)
  })

  it('renders nothing for an empty array', () => {
    InlineRenderer.render(el, [])
    expect(el.innerHTML).toBe('')
  })
})
