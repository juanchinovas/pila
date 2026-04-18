import { describe, it, expect } from 'vitest'
import { JsonSerializer } from './JsonSerializer'
import { Block } from '../types'

const BLOCKS: Block[] = [
  { id: '1', type: 'paragraph', content: [{ text: 'hello' }] },
  { id: '2', type: 'heading1', content: [{ text: 'Title' }] },
  { id: '3', type: 'divider' },
]

describe('JsonSerializer', () => {
  it('serializes blocks to JSON string', () => {
    const json = JsonSerializer.serialize(BLOCKS)
    expect(() => JSON.parse(json)).not.toThrow()
    const parsed = JSON.parse(json)
    expect(parsed).toHaveLength(3)
  })

  it('deserializes back to the original blocks', () => {
    const json = JsonSerializer.serialize(BLOCKS)
    const result = JsonSerializer.deserialize(json)
    expect(result).toEqual(BLOCKS)
  })

  it('round-trips without data loss', () => {
    const complex: Block[] = [
      {
        id: 'a',
        type: 'todo',
        content: [{ text: 'task', bold: true }],
        attrs: { checked: true },
      },
    ]
    expect(JsonSerializer.deserialize(JsonSerializer.serialize(complex))).toEqual(complex)
  })

  it('throws on invalid JSON', () => {
    expect(() => JsonSerializer.deserialize('not json')).toThrow()
  })

  it('throws when JSON is not an array', () => {
    expect(() => JsonSerializer.deserialize('{"id":"1"}')).toThrow()
  })
})
