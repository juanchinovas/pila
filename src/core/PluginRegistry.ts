import {
  CustomBlockDescriptor,
  PilaPlugin,
  PilaPluginAPI,
  ToolbarButtonDescriptor,
  EditorEvents,
  SlashMenuItemDescriptor,
} from '../types'
import { BlockManager } from './BlockManager'

export class PluginRegistry {
  private plugins = new Map<string, PilaPlugin>()
  private blockDescriptors = new Map<string, CustomBlockDescriptor>()
  private toolbarButtons: ToolbarButtonDescriptor[] = []
  private extraSlashItems: SlashMenuItemDescriptor[] = []

  /** Install a plugin. No-ops if already installed (by name). */
  install(
    plugin: PilaPlugin,
    editorEl: HTMLElement,
    manager: BlockManager,
    on: <K extends keyof EditorEvents>(event: K, handler: (payload: EditorEvents[K]) => void) => () => void
  ): void {
    if (this.plugins.has(plugin.name)) return
    this.plugins.set(plugin.name, plugin)

    const api: PilaPluginAPI = {
      editorEl,
      manager,
      on,
      registerBlockType: (desc) => {
        if (this.blockDescriptors.has(desc.type)) {
          console.warn(`[Pila] Block type "${desc.type}" is already registered.`)
          return
        }
        this.blockDescriptors.set(desc.type, desc)
        if (desc.slashItem) {
          this.extraSlashItems.push({ type: desc.type, ...desc.slashItem })
        }
      },
      addToolbarButton: (desc) => {
        this.toolbarButtons.push(desc)
      },
    }

    plugin.install(api)
  }

  /** Check if a block type is handled by a plugin. */
  hasBlockType(type: string): boolean {
    return this.blockDescriptors.has(type)
  }

  /** Render a custom block, returning its inner element. */
  renderCustomBlock(block: import('../types').Block): HTMLElement | null {
    const desc = this.blockDescriptors.get(block.type)
    if (!desc) return null
    return desc.factory(block)
  }

  /** All extra slash menu items registered by plugins. */
  getExtraSlashItems(): SlashMenuItemDescriptor[] {
    return [...this.extraSlashItems]
  }

  /** All extra toolbar buttons registered by plugins. */
  getToolbarButtons(): ToolbarButtonDescriptor[] {
    return [...this.toolbarButtons]
  }
}
