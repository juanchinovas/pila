import { BlockManager } from '../core/BlockManager'
import { PluginRegistry } from '../core/PluginRegistry'
import { BlockAttrs, BlockType } from '../types'
import { icon as makeIcon, Icons, LucideIconNode } from './icons'
import { ImagePropsModal } from './ImagePropsModal'

interface SlashItem {
  type: BlockType
  name: string
  description: string
  iconNode: LucideIconNode
  defaultAttrs?: Partial<BlockAttrs>
}

const ITEMS: SlashItem[] = [
  { type: 'paragraph',     name: 'Text',           description: 'Plain paragraph',          iconNode: Icons.AlignLeft     },
  { type: 'heading1',      name: 'Heading 1',      description: 'Big section heading',      iconNode: Icons.Heading1      },
  { type: 'heading2',      name: 'Heading 2',      description: 'Medium section heading',   iconNode: Icons.Heading2      },
  { type: 'heading3',      name: 'Heading 3',      description: 'Small section heading',    iconNode: Icons.Heading3      },
  { type: 'bulletList',    name: 'Bullet List',    description: 'Unordered list',           iconNode: Icons.List          },
  { type: 'numberedList',  name: 'Numbered List',  description: 'Ordered list',             iconNode: Icons.ListOrdered   },
  { type: 'todo',          name: 'To-do',          description: 'Checkbox list item',       iconNode: Icons.ListTodo      },
  { type: 'code',          name: 'Code',           description: 'Code block with language', iconNode: Icons.Code          },
  { type: 'quote',         name: 'Quote',              description: 'Blockquote',                  iconNode: Icons.Quote         },
  { type: 'callout',       name: 'Callout · Info',     description: 'Info callout box',             iconNode: Icons.Info,          defaultAttrs: { icon: '💡', flavor: 'info'    } },
  { type: 'callout',       name: 'Callout · Warning',  description: 'Warning callout box',          iconNode: Icons.AlertTriangle, defaultAttrs: { icon: '⚠️',  flavor: 'warning' } },
  { type: 'callout',       name: 'Callout · Error',    description: 'Error or danger callout box',  iconNode: Icons.AlertCircle,   defaultAttrs: { icon: '🚨', flavor: 'error'   } },
  { type: 'callout',       name: 'Callout · Success',  description: 'Success callout box',          iconNode: Icons.CheckCircle,   defaultAttrs: { icon: '✅', flavor: 'success' } },
  { type: 'callout',       name: 'Callout · Tip',      description: 'Tip or note callout box',      iconNode: Icons.Lightbulb,     defaultAttrs: { icon: '💬', flavor: 'tip'     } },
  { type: 'divider',       name: 'Divider',            description: 'Horizontal rule',              iconNode: Icons.Minus         },
  { type: 'image',         name: 'Image',          description: 'Image by URL',             iconNode: Icons.Image         },
  { type: 'table',         name: 'Table',          description: '3×3 grid (editable)',      iconNode: Icons.Table         },
  { type: 'columns',       name: 'Columns',        description: 'Flexbox column layout',    iconNode: Icons.Columns,       defaultAttrs: { columnDefs: [{ blocks: [] }, { blocks: [] }] } },
]

export class SlashMenu {
  private editorEl: HTMLElement
  private manager: BlockManager
  private plugins: PluginRegistry
  private menuEl!: HTMLElement
  private activeBlockId: string | null = null
  private filter = ''
  private selectedIndex = 0
  private filteredItems: SlashItem[] = []
  private onKeyDown!: (e: KeyboardEvent) => void
  private onInput!: (e: Event) => void
  private imageModal = new ImagePropsModal()

  constructor(editorEl: HTMLElement, manager: BlockManager, plugins = new PluginRegistry()) {
    this.editorEl = editorEl
    this.manager = manager
    this.plugins = plugins
  }

  mount(): void {
    this.menuEl = document.createElement('div')
    this.menuEl.className = 'pila-slash-menu'
    this.menuEl.style.display = 'none'
    document.body.appendChild(this.menuEl)

    this.onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e)
    this.onInput = (e: Event) => this.handleInput(e)

    this.editorEl.addEventListener('keydown', this.onKeyDown, true)
    this.editorEl.addEventListener('input', this.onInput)
  }

  destroy(): void {
    this.editorEl.removeEventListener('keydown', this.onKeyDown, true)
    this.editorEl.removeEventListener('input', this.onInput)
    this.menuEl?.remove()
    this.imageModal.destroy()
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.isOpen()) {
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this.moveSelection(1); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); e.stopPropagation(); this.moveSelection(-1); return }
      if (e.key === 'Enter')     { e.preventDefault(); e.stopPropagation(); this.confirm(); return }
      if (e.key === 'Escape')    { e.stopPropagation(); this.close(); return }
    }

    // Detect '/' at start of empty block or after whitespace
    if (e.key === '/') {
      const target = e.target as HTMLElement
      const blockId = target.dataset.blockId
      if (blockId && this.isAtStartOrEmpty(target)) {
        // Let the keystroke insert '/' first, then open on input
        this.activeBlockId = blockId
      }
    }
  }

  private handleInput(e: Event): void {
    const target = e.target as HTMLElement
    if (!target.hasAttribute('contenteditable')) return

    const text = target.textContent ?? ''
    const slashIdx = text.indexOf('/')

    if (slashIdx !== -1 && this.activeBlockId === (target.dataset.blockId ?? null)) {
      this.filter = text.slice(slashIdx + 1).toLowerCase()
      this.selectedIndex = 0
      this.renderItems()
      this.positionAt(target)
      this.show()
    } else {
      this.activeBlockId = null
      this.close()
    }
  }

  private isAtStartOrEmpty(el: HTMLElement): boolean {
    const text = el.textContent ?? ''
    if (text.trim() === '' || text.trim() === '/') return true

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return false
    const range = sel.getRangeAt(0)
    const pre = document.createRange()
    pre.setStart(el, 0)
    pre.setEnd(range.startContainer, range.startOffset)
    return pre.toString().trim() === ''
  }

  private renderItems(): void {
    const allItems = [...ITEMS, ...this.plugins.getExtraSlashItems()]
    const filtered = allItems.filter(
      (item) =>
        !this.filter ||
        item.name.toLowerCase().includes(this.filter) ||
        item.description.toLowerCase().includes(this.filter)
    )

    this.menuEl.innerHTML = ''

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'pila-slash-empty'
      empty.textContent = 'No results'
      this.menuEl.appendChild(empty)
      return
    }

    this.filteredItems = filtered as SlashItem[]

    filtered.forEach((item, idx) => {
      const row = document.createElement('div')
      row.className = 'pila-slash-item' + (idx === this.selectedIndex ? ' pila-slash-item--selected' : '')
      row.dataset.type = item.type

      const iconEl = document.createElement('span')
      iconEl.className = 'pila-slash-icon'
      if ('iconNode' in item) {
        iconEl.appendChild(makeIcon((item as SlashItem).iconNode, 18))
      } else {
        // plugin-provided string icon
        iconEl.textContent = (item as { icon: string }).icon
      }

      const text = document.createElement('span')
      text.className = 'pila-slash-text'

      const name = document.createElement('span')
      name.className = 'pila-slash-name'
      name.textContent = item.name

      const desc = document.createElement('span')
      desc.className = 'pila-slash-desc'
      desc.textContent = item.description

      text.appendChild(name)
      text.appendChild(desc)
      row.appendChild(iconEl)
      row.appendChild(text)

      row.addEventListener('mousedown', (e) => {
        e.preventDefault()
        this.selectedIndex = idx
        this.confirm()
      })

      this.menuEl.appendChild(row)
    })

    // Store filtered for confirm
    this.menuEl.dataset.filteredTypes = filtered.map((i) => i.type).join(',')
  }

  private moveSelection(delta: number): void {
    const items = this.menuEl.querySelectorAll('.pila-slash-item')
    if (!items.length) return
    this.selectedIndex = (this.selectedIndex + delta + items.length) % items.length

    items.forEach((el, idx) => {
      el.classList.toggle('pila-slash-item--selected', idx === this.selectedIndex)
    })
    const selected = items[this.selectedIndex] as HTMLElement
    selected.scrollIntoView({ block: 'nearest' })
  }

  private async confirm(): Promise<void> {
    if (!this.activeBlockId) return

    const types = (this.menuEl.dataset.filteredTypes ?? '').split(',') as BlockType[]
    const chosen = types[this.selectedIndex]
    if (!chosen) { this.close(); return }

    // Remove the slash + filter text from the block
    const contentEl = this.editorEl.querySelector(
      `[data-block-id="${this.activeBlockId}"] [contenteditable]`
    ) as HTMLElement | null

    if (contentEl) {
      const text = contentEl.textContent ?? ''
      const slashIdx = text.indexOf('/')
      const cleanText = slashIdx !== -1 ? text.slice(0, slashIdx) : ''

      if (chosen === 'divider') {
        // Turn current block into divider
        this.manager.update(this.activeBlockId, { type: 'divider', content: undefined })
      } else if (chosen === 'image') {
        const blockId = this.activeBlockId
        this.close()
        const result = await this.imageModal.openInsert()
        if (!result || !result.src) return
        this.manager.update(blockId, {
          type: 'image',
          content: undefined,
          attrs: { src: result.src, alt: result.alt, width: result.width || undefined, height: result.height || undefined, tailwindClasses: result.tailwindClasses || undefined },
        })
        return
      } else if (chosen === 'table') {
        const rows = this.makeDefaultTableRows()
        this.manager.update(this.activeBlockId, {
          type: 'table',
          content: undefined,
          attrs: { rows },
        })
      } else if (chosen === 'code') {
        this.manager.update(this.activeBlockId, {
          type: 'code',
          content: cleanText ? [{ text: cleanText }] : [],
          attrs: { language: 'plaintext' },
        })
      } else if (chosen === 'callout') {
        const item = this.filteredItems[this.selectedIndex]
        const defaultAttrs = item?.defaultAttrs ?? { icon: '💡', flavor: 'info' as const }
        this.manager.update(this.activeBlockId, {
          type: 'callout',
          content: cleanText ? [{ text: cleanText }] : [],
          attrs: defaultAttrs,
        })
      } else if (chosen === 'columns') {
        const item = this.filteredItems[this.selectedIndex]
        const columnDefs = item?.defaultAttrs?.columnDefs ?? [{ blocks: [] }, { blocks: [] }]
        this.manager.update(this.activeBlockId, {
          type: 'columns',
          content: undefined,
          attrs: { columnDefs },
        })
      } else {
        this.manager.update(this.activeBlockId, {
          type: chosen,
          content: cleanText ? [{ text: cleanText }] : [],
        })
      }
    }

    const id = this.activeBlockId
    this.close()

    requestAnimationFrame(() => {
      const focusEl = this.editorEl.querySelector(
        `[data-block-id="${id}"] [contenteditable]`
      ) as HTMLElement | null
      focusEl?.focus()
    })
  }

  private makeDefaultTableRows() {
    return [
      { cells: [{ content: [{ text: 'Header 1' }] }, { content: [{ text: 'Header 2' }] }, { content: [{ text: 'Header 3' }] }] },
      { cells: [{ content: [{ text: '' }] }, { content: [{ text: '' }] }, { content: [{ text: '' }] }] },
      { cells: [{ content: [{ text: '' }] }, { content: [{ text: '' }] }, { content: [{ text: '' }] }] },
    ]
  }

  private positionAt(el: HTMLElement): void {
    const rect = el.getBoundingClientRect()
    this.menuEl.style.top = `${rect.bottom + window.scrollY + 4}px`
    this.menuEl.style.left = `${rect.left + window.scrollX}px`
  }

  private show(): void {
    this.menuEl.style.display = 'block'
  }

  private close(): void {
    this.menuEl.style.display = 'none'
    this.activeBlockId = null
    this.filter = ''
    this.selectedIndex = 0
  }

  private isOpen(): boolean {
    return this.menuEl.style.display !== 'none'
  }
}
