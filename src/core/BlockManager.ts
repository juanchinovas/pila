import { Block, BlockType, BlockAttrs, InlineNode, EditorEvents } from '../types'
import { EventEmitter } from './EventEmitter'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export class BlockManager extends EventEmitter<EditorEvents> {
  private blocks: Block[] = []

  constructor(initial: Block[] = []) {
    super()
    this.blocks = initial.map((b) => ({ ...b }))
  }

  getAll(): Block[] {
    return [...this.blocks]  // Return copy to prevent external mutation
  }

  getById(id: string): Block | undefined {
    return this.blocks.find((b) => b.id === id)
  }

  getIndex(id: string): number {
    return this.blocks.findIndex((b) => b.id === id)
  }

  add(
    type: BlockType,
    options: { content?: InlineNode[]; attrs?: BlockAttrs; afterId?: string } = {}
  ): Block {
    const block: Block = {
      id: generateId(),
      type,
      ...(options.content !== undefined ? { content: options.content } : {}),
      ...(options.attrs !== undefined ? { attrs: options.attrs } : {}),
    }

    let index: number
    if (options.afterId !== undefined) {
      const afterIndex = this.blocks.findIndex((b) => b.id === options.afterId)
      index = afterIndex >= 0 ? afterIndex + 1 : this.blocks.length
    } else {
      index = this.blocks.length
    }

    this.blocks.splice(index, 0, block)
    this.emit('block:add', { block, index })
    this.emit('blocks:change', { blocks: this.getAll() })
    return block
  }

  update(id: string, changes: Partial<Omit<Block, 'id'>>): Block | undefined {
    const index = this.getIndex(id)
    if (index === -1) return undefined

    const existing = this.blocks[index]
    const updated: Block = {
      ...existing,
      ...changes,
      id,
      attrs:
        changes.attrs !== undefined
          ? { ...existing.attrs, ...changes.attrs }
          : existing.attrs,
    }
    this.blocks[index] = updated
    this.emit('block:update', { id, block: updated })
    this.emit('blocks:change', { blocks: this.getAll() })
    return updated
  }

  delete(id: string): boolean {
    const index = this.getIndex(id)
    if (index === -1) return false

    // Ensure at least one block remains
    if (this.blocks.length === 1) {
      // Reset to empty paragraph instead of removing
      const reset: Block = { id, type: 'paragraph', content: [] }
      this.blocks[0] = reset
      this.emit('block:update', { id, block: reset })
      this.emit('blocks:change', { blocks: this.getAll() })
      return true
    }

    this.blocks.splice(index, 1)
    this.emit('block:delete', { id })
    this.emit('blocks:change', { blocks: this.getAll() })
    return true
  }

  move(id: string, toIndex: number): boolean {
    const fromIndex = this.getIndex(id)
    if (fromIndex === -1) return false

    // After splice(fromIndex,1) all indices >= fromIndex shift down.
    // Adjust toIndex to account for that removal.
    const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
    const clamped = Math.max(0, Math.min(adjustedIndex, this.blocks.length - 1))
    const [block] = this.blocks.splice(fromIndex, 1)
    this.blocks.splice(clamped, 0, block)
    this.emit('block:move', { id, toIndex: clamped })
    this.emit('blocks:change', { blocks: this.getAll() })
    return true
  }

  reset(blocks: Block[]): void {
    this.blocks = blocks.map((b) => ({ ...b }))
    this.emit('blocks:change', { blocks: this.getAll() })
  }
}
