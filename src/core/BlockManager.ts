import { Block, BlockType, BlockAttrs, InlineNode, EditorEvents } from '../types';
import { EventEmitter } from './EventEmitter';
import { generateId } from './utils';

function compactAttrs(attrs: BlockAttrs | undefined): BlockAttrs | undefined {
  if (!attrs) return undefined;

  const entries = Object.entries(attrs).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries) as BlockAttrs;
}

export class BlockManager extends EventEmitter<EditorEvents> {
  private blocks: Block[] = [];
  private childManagers: Map<string, BlockManager> = new Map();

  constructor(initial: Block[] = []) {
    super();
    this.blocks = initial.map((b) => ({ ...b, id: b.id ?? generateId() }));
  }

  getAll(): Block[] {
    return [...this.blocks];  // Return copy to prevent external mutation
  }

  getById(id: string): Block | undefined {
    let block = this.blocks.find((b) => b.id === id);
    if (!block && this.childManagers.size > 0) {
      for (const childManager of this.childManagers.values()) {
        block = childManager.getById(id);
        if (block) break;
      }
    }

    return block;
  }

  getIndex(id: string): number {
    return this.blocks.findIndex((b) => b.id! === id);
  }

  add(
    type: BlockType,
    options: { content?: InlineNode[]; attrs?: BlockAttrs; afterId?: string } = {}
  ): Block {
    const block: Block = {
      id: generateId(),
      type,
      ...(options.content !== undefined ? { content: options.content } : {}),
      ...(options.attrs !== undefined ? { attrs: options.attrs } : {})
    };

    let index: number;
    if (options.afterId !== undefined) {
      const afterIndex = this.blocks.findIndex((b) => b.id! === options.afterId);
      index = afterIndex >= 0 ? afterIndex + 1 : this.blocks.length;
    } else {
      index = this.blocks.length;
    }

    this.blocks.splice(index, 0, block);
    this.emit('block:add', { block, index });
    this.emit('blocks:change', { blocks: this.getAll() });
    return block;
  }

  update(id: string, changes: Partial<Omit<Block, 'id'>>): Block | undefined {
    const index = this.getIndex(id);
    let isOnParent = index >= 0;
    let _childManager: BlockManager | null = null;
    let existingBlock = isOnParent ? this.blocks[index] : undefined;

    if (!isOnParent && this.childManagers.size == 0) {
      return undefined;
    }

    if (!isOnParent && this.childManagers.size > 0) {
      for (const childManager of this.childManagers.values()) {
        _childManager = childManager;
        existingBlock = childManager.getById(id);
        if (existingBlock) {
          break;
        }
      }
    }

    const existing = existingBlock!;
    const nextAttrs =
      changes.attrs !== undefined
        ? compactAttrs({ ...existing.attrs, ...changes.attrs })
        : existing.attrs;
    const updated: Block = {
      ...existing,
      ...changes,
      id,
      // `content: undefined` means "don't touch content" (same convention as attrs),
      // so an attrs-only update never wipes the block's existing content.
      content: changes.content !== undefined ? changes.content : existing.content,
      attrs: nextAttrs,
    };

    if (isOnParent) {
      this.blocks[index] = updated;
    } else if (_childManager) {
      _childManager.update(id, changes);
    }

    this.emit('block:update', { id, block: updated });
    this.emit('blocks:change', { blocks: this.getAll() });

    return updated;
  }

  delete(id: string): boolean {
    const index = this.getIndex(id);
    if (index === -1) return false;

    // Ensure at least one block remains
    if (this.blocks.length === 1) {
      // Reset to empty paragraph instead of removing
      const reset: Block = { id, type: 'paragraph', content: [] };
      this.blocks[0] = reset;
      this.emit('block:update', { id, block: reset });
      this.emit('blocks:change', { blocks: this.getAll() });
      return true;
    }

    this.blocks.splice(index, 1);
    this.emit('block:delete', { id });
    this.emit('blocks:change', { blocks: this.getAll() });
    return true;
  }

  move(id: string, toIndex: number): boolean {
    const fromIndex = this.getIndex(id);
    if (fromIndex === -1) return false;

    // After splice(fromIndex,1) all indices >= fromIndex shift down.
    // Adjust toIndex to account for that removal.
    const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    const clamped = Math.max(0, Math.min(adjustedIndex, this.blocks.length - 1));
    const [block] = this.blocks.splice(fromIndex, 1);
    this.blocks.splice(clamped, 0, block);
    this.emit('block:move', { id, toIndex: clamped });
    this.emit('blocks:change', { blocks: this.getAll() });
    return true;
  }

  duplicate(id: string): Block | undefined {
    const block = this.getById(id);
    if (!block) return undefined;
    return this.add(block.type, {
      content: block.content ? JSON.parse(JSON.stringify(block.content)) : undefined,
      attrs: block.attrs ? JSON.parse(JSON.stringify(block.attrs)) : undefined,
      afterId: id,
    });
  }

  remove(id: string): boolean {
    return this.delete(id);
  }

  insertAfter(afterId: string, type: BlockType): Block {
    return this.add(type, { afterId });
  }

  reset(blocks: Block[]): void {
    this.blocks = blocks.map((b) => ({ ...b }));
    this.emit('blocks:change', { blocks: this.getAll() });
  }

  addChildManager(parentBlockId: string, childManager: BlockManager): void {
    this.childManagers.set(parentBlockId, childManager);
  }

  removeChildManager(parentBlockId?: string): void {
    if (parentBlockId) {
      this.childManagers.delete(parentBlockId);
      return;
    }

    this.childManagers.clear();
  }
}
