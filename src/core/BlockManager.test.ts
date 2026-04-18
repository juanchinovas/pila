import { describe, it, expect, beforeEach } from 'vitest'
import { BlockManager } from './BlockManager'
import { Block } from '../types'

describe('BlockManager', () => {
  let manager: BlockManager

  beforeEach(() => {
    manager = new BlockManager()
  })

  // ─── getAll ───────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns empty array when initialized with no blocks', () => {
      expect(manager.getAll()).toEqual([])
    })

    it('returns a copy — mutations do not affect internal state', () => {
      manager.add('paragraph', { content: [{ text: 'hello' }] })
      const arr = manager.getAll()
      arr.push({ id: 'fake', type: 'paragraph' })
      expect(manager.getAll()).toHaveLength(1)
    })

    it('initializes with provided blocks', () => {
      const initial: Block[] = [{ id: 'a', type: 'paragraph', content: [{ text: 'hi' }] }]
      const m = new BlockManager(initial)
      expect(m.getAll()).toHaveLength(1)
      expect(m.getAll()[0].id).toBe('a')
    })
  })

  // ─── add ──────────────────────────────────────────────────────────────────

  describe('add', () => {
    it('appends a block at the end by default', () => {
      manager.add('paragraph', { content: [] })
      manager.add('heading1', { content: [{ text: 'Title' }] })
      const all = manager.getAll()
      expect(all).toHaveLength(2)
      expect(all[1].type).toBe('heading1')
    })

    it('inserts a block after a specific id', () => {
      const a = manager.add('paragraph', { content: [{ text: 'a' }] })
      manager.add('paragraph', { content: [{ text: 'c' }] })
      manager.add('paragraph', { content: [{ text: 'b' }], afterId: a.id })
      const all = manager.getAll()
      expect(all.map((b) => b.content?.[0]?.text)).toEqual(['a', 'b', 'c'])
    })

    it('falls back to appending when afterId is not found', () => {
      manager.add('paragraph', { content: [] })
      manager.add('paragraph', { content: [], afterId: 'nonexistent' })
      expect(manager.getAll()).toHaveLength(2)
    })

    it('assigns a unique id to every block', () => {
      const b1 = manager.add('paragraph', {})
      const b2 = manager.add('paragraph', {})
      expect(b1.id).not.toBe(b2.id)
    })

    it('emits block:add event', () => {
      const events: unknown[] = []
      manager.on('block:add', (p) => events.push(p))
      manager.add('paragraph', {})
      expect(events).toHaveLength(1)
    })
  })

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates content', () => {
      const b = manager.add('paragraph', { content: [{ text: 'old' }] })
      manager.update(b.id, { content: [{ text: 'new' }] })
      expect(manager.getById(b.id)?.content?.[0]?.text).toBe('new')
    })

    it('shallow-merges attrs', () => {
      const b = manager.add('todo', { attrs: { checked: false } })
      manager.update(b.id, { attrs: { checked: true } })
      expect(manager.getById(b.id)?.attrs?.checked).toBe(true)
    })

    it('returns undefined for unknown id', () => {
      expect(manager.update('unknown', {})).toBeUndefined()
    })

    it('emits block:update event', () => {
      const events: unknown[] = []
      const b = manager.add('paragraph', {})
      manager.on('block:update', (p) => events.push(p))
      manager.update(b.id, { content: [] })
      expect(events).toHaveLength(1)
    })
  })

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes a block', () => {
      manager.add('paragraph', { content: [{ text: 'first' }] })
      const b = manager.add('paragraph', {})
      manager.delete(b.id)
      expect(manager.getAll()).toHaveLength(1)
    })

    it('resets to empty paragraph instead of deleting the last block', () => {
      const b = manager.add('paragraph', { content: [{ text: 'last' }] })
      manager.delete(b.id)
      const all = manager.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].type).toBe('paragraph')
      expect(all[0].content).toEqual([])
    })

    it('returns false for unknown id', () => {
      expect(manager.delete('unknown')).toBe(false)
    })

    it('emits block:delete event for non-last blocks', () => {
      const events: unknown[] = []
      const a = manager.add('paragraph', {})
      manager.add('paragraph', {})
      manager.on('block:delete', (p) => events.push(p))
      manager.delete(a.id)
      expect(events).toHaveLength(1)
    })
  })

  // ─── move ─────────────────────────────────────────────────────────────────

  describe('move', () => {
    it('moves a block forward correctly', () => {
      // [A, B, C, D] → move A to after C → [B, C, A, D]
      const a = manager.add('paragraph', { content: [{ text: 'A' }] })
      manager.add('paragraph', { content: [{ text: 'B' }] })
      manager.add('paragraph', { content: [{ text: 'C' }] })
      manager.add('paragraph', { content: [{ text: 'D' }] })

      // Move A (index 0) to after C (index 2) → toIndex = 3
      manager.move(a.id, 3)
      const texts = manager.getAll().map((bl) => bl.content?.[0]?.text)
      expect(texts).toEqual(['B', 'C', 'A', 'D'])
    })

    it('moves a block backward correctly', () => {
      // [A, B, C, D] → move D (index 3) to before B (index 1) → [A, D, B, C]
      manager.add('paragraph', { content: [{ text: 'A' }] })
      const b = manager.add('paragraph', { content: [{ text: 'B' }] })
      manager.add('paragraph', { content: [{ text: 'C' }] })
      const d = manager.add('paragraph', { content: [{ text: 'D' }] })

      manager.move(d.id, manager.getIndex(b.id))
      const texts = manager.getAll().map((bl) => bl.content?.[0]?.text)
      expect(texts).toEqual(['A', 'D', 'B', 'C'])
    })

    it('clamps out-of-range toIndex', () => {
      const a = manager.add('paragraph', {})
      manager.add('paragraph', {})
      manager.move(a.id, 999)
      expect(manager.getAll()[1].id).toBe(a.id)
    })

    it('returns false for unknown id', () => {
      expect(manager.move('nope', 0)).toBe(false)
    })

    it('emits block:move event', () => {
      const events: unknown[] = []
      const a = manager.add('paragraph', {})
      manager.add('paragraph', {})
      manager.on('block:move', (p) => events.push(p))
      manager.move(a.id, 1)
      expect(events).toHaveLength(1)
    })
  })

  // ─── reset ────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('replaces all blocks', () => {
      manager.add('paragraph', {})
      manager.reset([{ id: 'x', type: 'heading1', content: [] }])
      expect(manager.getAll()).toHaveLength(1)
      expect(manager.getAll()[0].id).toBe('x')
    })
  })
})
