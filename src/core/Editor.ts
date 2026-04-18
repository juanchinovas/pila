import { Block, EditorEvents, EditorOptions } from '../types'
import { BlockManager } from './BlockManager'
import { PluginRegistry } from './PluginRegistry'
import { PilaBlock, BlockContext } from '../blocks/PilaBlock'
import '../blocks/ParagraphBlock'
import '../blocks/HeadingBlock'
import '../blocks/ListBlock'
import '../blocks/TodoBlock'
import '../blocks/CodeBlock'
import '../blocks/QuoteBlock'
import '../blocks/CalloutBlock'
import '../blocks/DividerBlock'
import '../blocks/ImageBlock'
import '../blocks/TableBlock'
import '../blocks/ColumnsBlock'
import { SlashMenu } from '../ui/SlashMenu'
import { FloatingToolbar } from '../ui/FloatingToolbar'

/** Generic wrapper for plugin-provided custom block types. */
class CustomBlock extends PilaBlock {
  innerEl!: HTMLElement

  protected buildDOM(): void {
    if (this.innerEl) this.appendChild(this.innerEl)
  }

  getContent(): Block { return { ...this.block } }
  focusBlock(): void { (this.innerEl as HTMLElement)?.focus?.() }
}
if (!customElements.get('pila-custom-block')) {
  customElements.define('pila-custom-block', CustomBlock)
}
import { DragHandle } from '../ui/DragHandle'
import { JsonSerializer } from '../serializers/JsonSerializer'
import { HtmlSerializer } from '../serializers/HtmlSerializer'
import { MarkdownSerializer } from '../serializers/MarkdownSerializer'
import { EmailSerializer } from '../serializers/EmailSerializer'

export class PilaEditor {
  private container: HTMLElement
  private options: EditorOptions
  private manager: BlockManager
  private plugins: PluginRegistry
  private blockInstances = new Map<string, PilaBlock>()
  private editorEl!: HTMLElement
  private slashMenu!: SlashMenu
  private floatingToolbar!: FloatingToolbar
  private dragHandle!: DragHandle
  private unsubscribers: Array<() => void> = []
  private _mounted = false

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    this.container = container
    this.options = options
    this.manager = new BlockManager(options.initialContent ?? [])
    this.plugins = new PluginRegistry()
  }

  mount(): void {
    if (this._mounted) return  // Guard against double-mount
    this._mounted = true

    // Build wrapper
    this.editorEl = document.createElement('div')
    this.editorEl.className = 'pila-editor'
    this.editorEl.setAttribute('data-pila', 'true')
    this.container.appendChild(this.editorEl)

    // Install plugins before first render so they can register block types
    const on = <K extends keyof EditorEvents>(
      event: K,
      handler: (payload: EditorEvents[K]) => void
    ) => {
      const unsub = this.manager.on(event, handler)
      this.unsubscribers.push(unsub)
      return unsub
    }
    for (const plugin of this.options.plugins ?? []) {
      this.plugins.install(plugin, this.editorEl, this.manager, on)
    }

    // Seed with one paragraph if empty
    if (this.manager.getAll().length === 0) {
      this.manager.add('paragraph', { content: [] })
    }

    // Initial render
    this.renderAll()

    // Re-render on block model changes
    const unsub = this.manager.on('blocks:change', () => this.renderAll())
    this.unsubscribers.push(unsub)

    // UI overlays — pass plugin registry so they can include extra items/buttons
    this.slashMenu = new SlashMenu(this.editorEl, this.manager, this.plugins)
    this.floatingToolbar = new FloatingToolbar(this.editorEl, this.manager, this.plugins)
    this.dragHandle = new DragHandle(this.editorEl, this.manager)

    this.slashMenu.mount()
    this.floatingToolbar.mount()
    this.dragHandle.mount()

    // User onChange callback
    if (this.options.onChange) {
      const unsub2 = this.manager.on('blocks:change', ({ blocks }) => {
        this.options.onChange!(blocks)
      })
      this.unsubscribers.push(unsub2)
    }
  }

  destroy(): void {
    if (!this._mounted) return
    this._mounted = false

    this.unsubscribers.forEach((fn) => fn())
    this.unsubscribers = []
    this.slashMenu?.destroy()
    this.floatingToolbar?.destroy()
    this.dragHandle?.destroy()
    this.blockInstances.forEach((b) => b.destroy())
    this.blockInstances.clear()
    this.editorEl?.remove()
    this.manager.removeAllListeners()
  }

  getContent(format: 'json' | 'html' | 'markdown' | 'email'): string {
    const blocks = this.manager.getAll().map((block) => {
      const instance = this.blockInstances.get(block.id)
      return instance ? instance.getContent() : block
    })

    switch (format) {
      case 'json':     return JsonSerializer.serialize(blocks)
      case 'html':     return HtmlSerializer.serialize(blocks)
      case 'markdown': return MarkdownSerializer.serialize(blocks)
      case 'email':    return EmailSerializer.serialize(blocks)
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private renderAll(): void {
    const blocks = this.manager.getAll()
    const seenIds = new Set<string>()

    blocks.forEach((block, index) => {
      seenIds.add(block.id)

      let instance = this.blockInstances.get(block.id)

      // Destroy and recreate if block type changed (e.g. via slash menu)
      if (instance && instance.blockType !== block.type) {
        instance.destroy()
        this.blockInstances.delete(block.id)
        instance = undefined
      }

      if (!instance) {
        instance = this.createBlockInstance(block)
        this.blockInstances.set(block.id, instance)
      } else {
        instance.updateData(block)
      }

      const el = instance
      el.dataset.blockId = block.id
      el.dataset.blockIndex = String(index)

      // Insert in correct position
      const existingAt = this.editorEl.children[index]
      if (existingAt !== el) {
        if (existingAt) {
          this.editorEl.insertBefore(el, existingAt)
        } else {
          this.editorEl.appendChild(el)
        }
      }
    })

    // Remove stale instances
    this.blockInstances.forEach((instance, id) => {
      if (!seenIds.has(id)) {
        instance.destroy()
        this.blockInstances.delete(id)
      }
    })

    // Remove extra DOM nodes (shouldn't happen but safety net)
    while (this.editorEl.children.length > blocks.length) {
      this.editorEl.removeChild(this.editorEl.lastChild!)
    }
  }

  private createBlockInstance(block: Block): PilaBlock {
    const ctx: BlockContext = {
      manager: this.manager,
      editorEl: this.editorEl,
      placeholder: this.options.placeholder,
    }

    // Plugin-registered custom block types
    if (this.plugins.hasBlockType(block.type)) {
      const innerEl = this.plugins.renderCustomBlock(block)
      if (innerEl) {
        const custom = document.createElement('pila-custom-block') as CustomBlock
        custom.block = block
        custom.ctx = ctx
        custom.innerEl = innerEl
        return custom
      }
    }

    let el: PilaBlock
    switch (block.type) {
      case 'paragraph':
        el = document.createElement('pila-paragraph') as PilaBlock
        break
      case 'heading1':
      case 'heading2':
      case 'heading3':
        el = document.createElement('pila-heading') as PilaBlock
        break
      case 'bulletList':
      case 'numberedList':
        el = document.createElement('pila-list') as PilaBlock
        break
      case 'todo':
        el = document.createElement('pila-todo') as PilaBlock
        break
      case 'code':
        el = document.createElement('pila-code') as PilaBlock
        break
      case 'quote':
        el = document.createElement('pila-quote') as PilaBlock
        break
      case 'callout':
        el = document.createElement('pila-callout') as PilaBlock
        break
      case 'divider':
        el = document.createElement('pila-divider') as PilaBlock
        break
      case 'image':
        el = document.createElement('pila-image') as PilaBlock
        break
      case 'table':
        el = document.createElement('pila-table') as PilaBlock
        break
      case 'columns':
        el = document.createElement('pila-columns') as PilaBlock
        break
      default:
        el = document.createElement('pila-paragraph') as PilaBlock
        break
    }

    el.block = block
    el.ctx = ctx
    return el
  }
}
