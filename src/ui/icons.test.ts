import { describe, it, expect } from 'vitest'
import { icon, Icons } from './icons'
import type { IconDef } from './icons'

const NS = 'http://www.w3.org/2000/svg'

describe('icon()', () => {
  it('returns an SVGElement', () => {
    const el = icon(Icons.Bold)
    expect(el instanceof SVGElement).toBe(true)
    expect(el.tagName.toLowerCase()).toBe('svg')
  })

  it('sets default size to 16', () => {
    const el = icon(Icons.Bold)
    expect(el.getAttribute('width')).toBe('16')
    expect(el.getAttribute('height')).toBe('16')
  })

  it('respects custom size', () => {
    const el = icon(Icons.Bold, 24)
    expect(el.getAttribute('width')).toBe('24')
    expect(el.getAttribute('height')).toBe('24')
  })

  it('sets standard SVG attributes', () => {
    const el = icon(Icons.Bold)
    expect(el.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(el.getAttribute('fill')).toBe('none')
    expect(el.getAttribute('stroke')).toBe('currentColor')
    expect(el.getAttribute('aria-hidden')).toBe('true')
  })

  it('appends child elements for each IconElement in the def', () => {
    // Bold has exactly 1 child: a <path>
    const el = icon(Icons.Bold)
    expect(el.childElementCount).toBe(Icons.Bold.length)
  })

  it('child elements are in the SVG namespace', () => {
    const el = icon(Icons.Bold)
    const child = el.firstElementChild!
    expect(child.namespaceURI).toBe(NS)
  })

  it('child element attributes match the IconDef', () => {
    const def: IconDef = [['circle', { cx: '12', cy: '12', r: '5' }]]
    const el = icon(def)
    const circle = el.firstElementChild!
    expect(circle.tagName.toLowerCase()).toBe('circle')
    expect(circle.getAttribute('cx')).toBe('12')
    expect(circle.getAttribute('cy')).toBe('12')
    expect(circle.getAttribute('r')).toBe('5')
  })

  it('handles an empty IconDef (no children)', () => {
    const el = icon([])
    expect(el.childElementCount).toBe(0)
  })

  it('handles a multi-element IconDef', () => {
    // Italic has 3 line elements
    const el = icon(Icons.Italic)
    expect(el.childElementCount).toBe(3)
    for (const child of Array.from(el.children)) {
      expect(child.tagName.toLowerCase()).toBe('line')
    }
  })
})

describe('Icons map', () => {
  it('exports a non-empty Icons map', () => {
    expect(Object.keys(Icons).length).toBeGreaterThan(0)
  })

  it('every entry is a non-empty array', () => {
    for (const [name, def] of Object.entries(Icons)) {
      expect(Array.isArray(def), `Icons.${name} should be an array`).toBe(true)
      expect(def.length, `Icons.${name} should have at least one element`).toBeGreaterThan(0)
    }
  })

  it('every IconElement is a [tagName, attrs] tuple', () => {
    for (const [name, def] of Object.entries(Icons)) {
      for (const el of def) {
        expect(Array.isArray(el), `entry in Icons.${name} should be an array`).toBe(true)
        expect(el.length).toBe(2)
        expect(typeof el[0]).toBe('string')
        expect(typeof el[1]).toBe('object')
      }
    }
  })

  it('icon() produces a valid SVG for every entry in Icons', () => {
    for (const [name, def] of Object.entries(Icons)) {
      const el = icon(def)
      expect(el.tagName.toLowerCase(), `Icons.${name} should produce an <svg>`).toBe('svg')
    }
  })
})
