import { Block, ColumnDef } from '../types'
import { BlockManager } from './BlockManager'
import { BlockContext, PilaBlock } from '../blocks/PilaBlock'
import { SlashMenu } from '../ui/SlashMenu'
import { DragHandle } from '../ui/DragHandle'
import { createBlockEl } from './BlockFactory'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/**
 * Lightweight mini-editor for a single column inside a ColumnsBlock.
 * Each column gets its own BlockManager + SlashMenu so every block type
 * (including nested headings, lists, code, tables …) works inside it.
 */
export class ColumnEditor {
  readonly el: HTMLDivElement
  readonly manager: BlockManager

  onEscapeUp:   (() => void) | null = null
  onEscapeDown: (() => void) | null = null

  private placeholder: string
  private blockInstances = new Map<string, PilaBlock>()
  private slashMenu!: SlashMenu
  private dragHandle!: DragHandle
  private unsub: (() => void) | null = null

  constructor(def: ColumnDef, placeholder = 'Type / to add a block…') {
    this.placeholder = placeholder

    this.el = document.createElement('div')
    this.el.className = 'pila-column-editor'

    const initial: Block[] =
      def.blocks && def.blocks.length > 0
        ? def.blocks
        : [{ id: generateId(), type: 'paragraph', content: [] }]

    this.manager = new BlockManager(initial)
    this.unsub    = this.manager.on('blocks:change', () => this.renderAll())
    this.renderAll()

    this.slashMenu = new SlashMenu(this.el, this.manager)
    this.slashMenu.mount()

    this.dragHandle = new DragHandle(this.el, this.manager)
    this.dragHandle.mount()

    this.el.addEventListener('keydown', (e: KeyboardEvent) => this.handleEscape(e))
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private get ctx(): BlockContext {
    return { manager: this.manager, editorEl: this.el, placeholder: this.placeholder }
  }

  private renderAll(): void {
    const blocks  = this.manager.getAll()
    const seenIds = new Set<string>()

    blocks.forEach((block, index) => {
      seenIds.add(block.id)

      let instance = this.blockInstances.get(block.id)

      if (instance && instance.blockType !== block.type) {
        instance.destroy()
        this.blockInstances.delete(block.id)
        instance = undefined
      }

      if (!instance) {
        instance = createBlockEl(block, this.ctx)
        this.blockInstances.set(block.id, instance)
      } else {
        instance.updateData(block)
      }

      instance.dataset.blockId    = block.id
      instance.dataset.blockIndex = String(index)

      const existingAt = this.el.children[index]
      if (existingAt !== instance) {
        if (existingAt) {
          this.el.insertBefore(instance, existingAt)
        } else {
          this.el.appendChild(instance)
        }
      }
    })

    // Remove stale instances
    this.blockInstances.forEach((inst, id) => {
      if (!seenIds.has(id)) {
        inst.destroy()
        this.blockInstances.delete(id)
      }
    })

    // Safety: trim extra DOM children
    while (this.el.children.length > blocks.length) {
      this.el.removeChild(this.el.lastChild!)
    }
  }

  // ── Private ─ escape detection ────────────────────────────────────────────

  private handleEscape(e: KeyboardEvent): void {
    // If the inner block already handled the navigation, skip.
    if (e.defaultPrevented) return
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return

    const blocks  = this.manager.getAll()
    const focused = (e.target as Element)?.closest<HTMLElement>('[data-block-id]')
    if (!focused) return

    const idx = blocks.findIndex((b) => b.id === focused.dataset.blockId)
    if (idx === -1) return

    if (e.key === 'ArrowUp' && idx === 0 && this.onEscapeUp) {
      e.preventDefault()
      this.onEscapeUp()
    } else if (e.key === 'ArrowDown' && idx === blocks.length - 1 && this.onEscapeDown) {
      e.preventDefault()
      this.onEscapeDown()
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Collect current block data from live instances. */
  getBlocks(): Block[] {
    return this.manager.getAll().map((b) => {
      const inst = this.blockInstances.get(b.id)
      return inst ? inst.getContent() : b
    })
  }

  focusFirst(): void {
    const first = this.el.querySelector<HTMLElement>('[contenteditable]')
    first?.focus()
  }

  focusLast(): void {
    const all = this.el.querySelectorAll<HTMLElement>('[contenteditable]')
    all[all.length - 1]?.focus()
  }

  destroy(): void {
    this.unsub?.()
    this.slashMenu?.destroy()
    this.dragHandle?.destroy()
    this.blockInstances.forEach((inst) => inst.destroy())
    this.blockInstances.clear()
  }
}
