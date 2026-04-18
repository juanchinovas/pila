import { BlockManager } from '../core/BlockManager'
import { PluginRegistry } from '../core/PluginRegistry'
import { InlineFormatter } from '../inline/InlineFormatter'
import { icon, Icons, LucideIconNode } from './icons'

interface ToolbarButton {
  iconNode: LucideIconNode
  title: string
  mark: string
  command: () => void
}

export class FloatingToolbar {
  private editorEl: HTMLElement
  private manager: BlockManager
  private plugins: PluginRegistry
  private toolbarEl!: HTMLElement
  private onSelectionChange!: () => void
  private savedRange: Range | null = null
  private isLinkMode: boolean = false
  private focusedBlockId: string | null = null

  constructor(editorEl: HTMLElement, manager: BlockManager, plugins = new PluginRegistry()) {
    this.editorEl = editorEl
    this.manager = manager
    this.plugins = plugins
  }

  mount(): void {
    this.toolbarEl = this.buildToolbar()
    document.body.appendChild(this.toolbarEl)

    this.onSelectionChange = () => this.handleSelectionChange()
    document.addEventListener('selectionchange', this.onSelectionChange)
  }

  destroy(): void {
    document.removeEventListener('selectionchange', this.onSelectionChange)
    this.toolbarEl?.remove()
  }

  private buildToolbar(): HTMLElement {
    const toolbar = document.createElement('div')
    toolbar.className = 'pila-floating-toolbar'
    toolbar.style.display = 'none'

    const buttons: ToolbarButton[] = [
      { iconNode: Icons.Bold,      title: 'Bold',      mark: 'bold',      command: () => { InlineFormatter.toggleBold();      this.refreshActiveState() } },
      { iconNode: Icons.Italic,    title: 'Italic',    mark: 'italic',    command: () => { InlineFormatter.toggleItalic();    this.refreshActiveState() } },
      { iconNode: Icons.Underline, title: 'Underline', mark: 'underline', command: () => { InlineFormatter.toggleUnderline(); this.refreshActiveState() } },
      { iconNode: Icons.Code,      title: 'Code',      mark: 'code',      command: () => { InlineFormatter.toggleCode();      this.refreshActiveState() } },
    ]

    buttons.forEach(({ iconNode, title, mark, command }) => {
      const btn = document.createElement('button')
      btn.className = 'pila-toolbar-btn'
      btn.title = title
      btn.appendChild(icon(iconNode))
      btn.dataset.mark = mark
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault() // Keep selection
        command()
      })
      toolbar.appendChild(btn)
    })

    // Separator
    const sep = document.createElement('span')
    sep.className = 'pila-toolbar-sep'
    toolbar.appendChild(sep)

    // Link button
    const linkBtn = document.createElement('button')
    linkBtn.className = 'pila-toolbar-btn'
    linkBtn.title = 'Link'
    linkBtn.appendChild(icon(Icons.Link))
    linkBtn.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.toggleLinkInput(toolbar)
    })
    toolbar.appendChild(linkBtn)

    // Alignment separator + buttons
    const sepAlign = document.createElement('span')
    sepAlign.className = 'pila-toolbar-sep'
    toolbar.appendChild(sepAlign)

    const alignments: { iconNode: LucideIconNode; title: string; value: string }[] = [
      { iconNode: Icons.AlignLeft,    title: 'Align left',    value: 'left'    },
      { iconNode: Icons.AlignCenter,  title: 'Align center',  value: 'center'  },
      { iconNode: Icons.AlignRight,   title: 'Align right',   value: 'right'   },
      { iconNode: Icons.AlignJustify, title: 'Justify',       value: 'justify' },
    ]

    alignments.forEach(({ iconNode, title, value }) => {
      const btn = document.createElement('button')
      btn.className = 'pila-toolbar-btn'
      btn.title = title
      btn.dataset.align = value
      btn.appendChild(icon(iconNode))
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        this.applyAlignment(value)
      })
      toolbar.appendChild(btn)
    })

    // Plugin-registered extra toolbar buttons
    const extraButtons = this.plugins.getToolbarButtons()
    if (extraButtons.length > 0) {
      const sep2 = document.createElement('span')
      sep2.className = 'pila-toolbar-sep'
      toolbar.appendChild(sep2)

      extraButtons.forEach((desc) => {
        const btn = document.createElement('button')
        btn.className = 'pila-toolbar-btn'
        btn.title = desc.title
        btn.innerHTML = desc.label
        if (desc.markName) btn.dataset.mark = desc.markName
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault()
          desc.command()
          this.refreshActiveState()
        })
        toolbar.appendChild(btn)
      })
    }

    return toolbar
  }

  private applyAlignment(alignment: string): void {
    if (!this.focusedBlockId) return
    const block = this.manager.getAll().find((b) => b.id === this.focusedBlockId)
    if (!block) return
    this.manager.update(this.focusedBlockId, {
      attrs: { ...(block.attrs ?? {}), alignment: alignment as 'left' | 'center' | 'right' | 'justify' },
    })
    this.refreshActiveState()
  }

  private toggleLinkInput(toolbar: HTMLElement): void {
    if (this.isLinkMode) {
      this.closeLinkMode()
      return
    }

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || sel.isCollapsed) return
    this.savedRange = sel.getRangeAt(0).cloneRange()

    this.isLinkMode = true

    // Capture existing link href (if selection is inside a link)
    const existingHref = InlineFormatter.getActiveMarks().link ?? ''

    // Hide all current toolbar children
    Array.from(toolbar.children).forEach((el) => {
      ;(el as HTMLElement).style.display = 'none'
    })

    const linkArea = document.createElement('div')
    linkArea.className = 'pila-toolbar-link-area'

    const input = document.createElement('input')
    input.type = 'url'
    input.placeholder = 'https://…'
    input.className = 'pila-toolbar-link-input'
    input.value = existingHref

    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'pila-toolbar-btn pila-toolbar-btn--confirm'
    confirmBtn.title = 'Apply link'
    confirmBtn.appendChild(icon(Icons.Check))

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'pila-toolbar-btn'
    cancelBtn.title = 'Cancel'
    cancelBtn.appendChild(icon(Icons.X))

    const applyLink = () => {
      if (this.savedRange) {
        const s = window.getSelection()
        s?.removeAllRanges()
        s?.addRange(this.savedRange)
      }
      InlineFormatter.setLink(input.value.trim(), this.manager)
      this.closeLinkMode()
      this.hide()
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); applyLink() }
      if (e.key === 'Escape') { e.preventDefault(); this.closeLinkMode() }
    })

    confirmBtn.addEventListener('mousedown', (e) => { e.preventDefault(); applyLink() })
    cancelBtn.addEventListener('mousedown', (e) => { e.preventDefault(); this.closeLinkMode() })

    linkArea.appendChild(input)
    linkArea.appendChild(confirmBtn)
    linkArea.appendChild(cancelBtn)
    toolbar.appendChild(linkArea)
    input.focus()
    input.select()
  }

  private closeLinkMode(): void {
    this.isLinkMode = false
    this.savedRange = null
    this.toolbarEl.querySelector('.pila-toolbar-link-area')?.remove()
    Array.from(this.toolbarEl.children).forEach((el) => {
      ;(el as HTMLElement).style.display = ''
    })
  }

  private handleSelectionChange(): void {
    if (this.isLinkMode) return

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      this.hide()
      return
    }

    const range = sel.getRangeAt(0)
    // Only show inside our editor
    if (!this.editorEl.contains(range.commonAncestorContainer)) {
      this.hide()
      return
    }

    const rect = range.getBoundingClientRect()
    if (!rect.width) {
      this.hide()
      return
    }

    // Track focused block for alignment commands
    const node = range.commonAncestorContainer
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
    this.focusedBlockId = el?.closest('.pila-block')?.getAttribute('data-block-id') ?? null

    this.show(rect)
    this.refreshActiveState()
  }

  private show(rect: DOMRect): void {
    const toolbar = this.toolbarEl
    toolbar.style.display = 'flex'
    const tbRect = toolbar.getBoundingClientRect()
    const top = rect.top + window.scrollY - tbRect.height - 8
    const left = rect.left + window.scrollX + rect.width / 2 - tbRect.width / 2

    toolbar.style.top = `${Math.max(8, top)}px`
    toolbar.style.left = `${Math.max(8, left)}px`

    document.dispatchEvent(new CustomEvent('pila:text-selection', { detail: { active: true } }))
  }

  private hide(): void {
    this.toolbarEl.style.display = 'none'
    document.dispatchEvent(new CustomEvent('pila:text-selection', { detail: { active: false } }))
  }

  private refreshActiveState(): void {
    const marks = InlineFormatter.getActiveMarks()
    const map: Record<string, boolean> = {
      bold: marks.bold,
      italic: marks.italic,
      underline: marks.underline,
      code: marks.code,
    }
    this.toolbarEl.querySelectorAll<HTMLButtonElement>('.pila-toolbar-btn[data-mark]').forEach((btn) => {
      const mark = btn.dataset.mark ?? ''
      btn.classList.toggle('pila-toolbar-btn--active', map[mark] ?? false)
    })

    // Alignment active state
    const block = this.focusedBlockId
      ? this.manager.getAll().find((b) => b.id === this.focusedBlockId)
      : null
    const currentAlign = block?.attrs?.alignment ?? 'left'
    this.toolbarEl.querySelectorAll<HTMLButtonElement>('.pila-toolbar-btn[data-align]').forEach((btn) => {
      btn.classList.toggle('pila-toolbar-btn--active', btn.dataset.align === currentAlign)
    })
  }
}
