import { describe, it, expect } from 'vitest'
import { PluginRegistry } from './PluginRegistry'
import { BlockManager } from './BlockManager'
import { Block, PilaPlugin } from '../types'

function makeEditorEl(): HTMLElement {
  return document.createElement('div')
}

function makeManager(): BlockManager {
  return new BlockManager()
}

describe('PluginRegistry', () => {
  it('installs a plugin exactly once (idempotent by name)', () => {
    const registry = new PluginRegistry()
    const el = makeEditorEl()
    const manager = makeManager()
    let callCount = 0

    const plugin: PilaPlugin = {
      name: 'test-plugin',
      install() { callCount++ },
    }

    registry.install(plugin, el, manager, () => () => {})
    registry.install(plugin, el, manager, () => () => {})  // second call no-op
    expect(callCount).toBe(1)
  })

  it('registers a custom block type', () => {
    const registry = new PluginRegistry()
    const el = makeEditorEl()
    const manager = makeManager()

    const plugin: PilaPlugin = {
      name: 'video',
      install(api) {
        api.registerBlockType({
          type: 'video',
          factory: (_block: Block) => {
            const div = document.createElement('div')
            div.textContent = 'video'
            return div
          },
        })
      },
    }

    registry.install(plugin, el, manager, () => () => {})
    expect(registry.hasBlockType('video')).toBe(true)
  })

  it('renders a custom block via its factory', () => {
    const registry = new PluginRegistry()
    const el = makeEditorEl()
    const manager = makeManager()

    registry.install(
      {
        name: 'map',
        install(api) {
          api.registerBlockType({
            type: 'map',
            factory: (block) => {
              const div = document.createElement('div')
              div.dataset.src = block.attrs?.src ?? ''
              return div
            },
          })
        },
      },
      el,
      manager,
      () => () => {}
    )

    const inner = registry.renderCustomBlock({
      id: 'x',
      type: 'map',
      attrs: { src: 'https://maps.example.com' },
    })

    expect(inner).not.toBeNull()
    expect((inner as HTMLElement).dataset.src).toBe('https://maps.example.com')
  })

  it('returns null for an unregistered block type', () => {
    const registry = new PluginRegistry()
    expect(registry.renderCustomBlock({ id: '1', type: 'unknown' })).toBeNull()
  })

  it('collects extra slash menu items from plugins', () => {
    const registry = new PluginRegistry()
    const el = makeEditorEl()
    const manager = makeManager()

    registry.install(
      {
        name: 'mention',
        install(api) {
          api.registerBlockType({
            type: 'mention',
            factory: () => document.createElement('span'),
            slashItem: { name: 'Mention', description: 'Mention a user', icon: '@' },
          })
        },
      },
      el,
      manager,
      () => () => {}
    )

    const items = registry.getExtraSlashItems()
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('mention')
    expect(items[0].icon).toBe('@')
  })

  it('collects toolbar buttons from plugins', () => {
    const registry = new PluginRegistry()
    const el = makeEditorEl()
    const manager = makeManager()

    registry.install(
      {
        name: 'highlight',
        install(api) {
          api.addToolbarButton({
            label: '🖍',
            title: 'Highlight',
            command: () => {},
          })
        },
      },
      el,
      manager,
      () => () => {}
    )

    const buttons = registry.getToolbarButtons()
    expect(buttons).toHaveLength(1)
    expect(buttons[0].title).toBe('Highlight')
  })

  it('warns when registering a duplicate block type', () => {
    const registry = new PluginRegistry()
    const el = makeEditorEl()
    const manager = makeManager()
    const warns: string[] = []
    const orig = console.warn
    console.warn = (...args: unknown[]) => warns.push(String(args[0]))

    const desc = { type: 'dupe', factory: () => document.createElement('div') }
    registry.install({ name: 'p1', install: (api) => api.registerBlockType(desc) }, el, manager, () => () => {})
    registry.install({ name: 'p2', install: (api) => api.registerBlockType(desc) }, el, manager, () => () => {})

    console.warn = orig
    expect(warns.some((w) => w.includes('dupe'))).toBe(true)
  })
})
