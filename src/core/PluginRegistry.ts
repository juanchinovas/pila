import {
  CustomBlockDescriptor,
  EmojiItem,
  EmojiProviderDescriptor,
  EmojiQueryContext,
  PilaPlugin,
  PilaPluginAPI,
  ToolbarButtonDescriptor,
  EditorEvents,
  SlashMenuItemDescriptor,
} from '../types';
import { BlockManager } from './BlockManager';
import { DEFAULT_EMOJI_ITEMS } from './defaultEmojiItems';

interface RegisteredEmojiProvider {
  descriptor: EmojiProviderDescriptor
  registrationOrder: number
}

export class PluginRegistry {
  private plugins = new Map<string, PilaPlugin>();
  private blockDescriptors = new Map<string, CustomBlockDescriptor>();
  private toolbarButtons: ToolbarButtonDescriptor[] = [];
  private extraSlashItems: SlashMenuItemDescriptor[] = [];
  private emojiProviders: RegisteredEmojiProvider[] = [];
  private emojiProviderKeys = new Set<string>();
  private nextEmojiProviderOrder = 0;

  constructor() {
    this.registerEmojiProvider({
      key: 'builtin-emoji',
      priority: -100,
      search: (query) => this.searchDefaultEmoji(query),
    });
  }

  /** Install a plugin. No-ops if already installed (by name). */
  install(
    plugin: PilaPlugin,
    editorEl: HTMLElement,
    manager: BlockManager,
    on: <K extends keyof EditorEvents>(event: K, handler: (payload: EditorEvents[K]) => void) => () => void
  ): void {
    if (this.plugins.has(plugin.name)) return;
    this.plugins.set(plugin.name, plugin);

    const api: PilaPluginAPI = {
      editorEl,
      manager,
      on,
      registerBlockType: (desc) => {
        if (this.blockDescriptors.has(desc.type)) {
          console.warn(`[Pila] Block type "${desc.type}" is already registered.`);
          return;
        }
        this.blockDescriptors.set(desc.type, desc);
        if (desc.slashItem) {
          this.extraSlashItems.push({ type: desc.type, ...desc.slashItem });
        }
      },
      registerEmojiProvider: (descriptor) => {
        this.registerEmojiProvider(descriptor);
      },
      addToolbarButton: (desc) => {
        this.toolbarButtons.push(desc);
      },
    };

    plugin.install(api);
  }

  /** Check if a block type is handled by a plugin. */
  hasBlockType(type: string): boolean {
    return this.blockDescriptors.has(type);
  }

  /** Render a custom block, returning its inner element. */
  renderCustomBlock(block: import('../types').Block): HTMLElement | null {
    const desc = this.blockDescriptors.get(block.type);
    if (!desc) return null;
    return desc.factory(block);
  }

  /** All extra slash menu items registered by plugins. */
  getExtraSlashItems(): SlashMenuItemDescriptor[] {
    return [...this.extraSlashItems];
  }

  /** All extra toolbar buttons registered by plugins. */
  getToolbarButtons(): ToolbarButtonDescriptor[] {
    return [...this.toolbarButtons];
  }

  async queryEmoji(query: string, context: EmojiQueryContext): Promise<EmojiItem[]> {
    const providers = [...this.emojiProviders].sort((left, right) => {
      const priorityDiff = (right.descriptor.priority ?? 0) - (left.descriptor.priority ?? 0);
      return priorityDiff !== 0 ? priorityDiff : left.registrationOrder - right.registrationOrder;
    });

    const merged: EmojiItem[] = [];
    const seen = new Set<string>();

    for (const provider of providers) {
      const items = await Promise.resolve(provider.descriptor.search(query, context));
      for (const item of items) {
        const dedupeKey = `${item.name}::${item.emoji}::${item.insertText ?? ''}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        merged.push(item);
      }
    }

    return merged;
  }

  private registerEmojiProvider(descriptor: EmojiProviderDescriptor): void {
    if (this.emojiProviderKeys.has(descriptor.key)) {
      console.warn(`[Pila] Emoji provider "${descriptor.key}" is already registered.`);
      return;
    }

    this.emojiProviderKeys.add(descriptor.key);
    this.emojiProviders.push({
      descriptor,
      registrationOrder: this.nextEmojiProviderOrder++,
    });
  }

  private searchDefaultEmoji(query: string): EmojiItem[] {
    const normalizedQuery = query.trim().toLowerCase();
    return DEFAULT_EMOJI_ITEMS.filter((item) => {
      if (!normalizedQuery) return true;
      return item.name.includes(normalizedQuery)
        || item.keywords?.some((keyword) => keyword.toLowerCase().includes(normalizedQuery));
    }).slice(0, 50);
  }
}
