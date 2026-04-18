import { Block, ColumnDef } from '../types'
import { PilaBlock } from './PilaBlock'
import { ColumnEditor } from '../core/ColumnEditor'
import { ColumnsToolbar, ColumnsToolbarContext } from '../ui/ColumnsToolbar'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export class ColumnsBlock extends PilaBlock {
  private containerEl!: HTMLDivElement
  private toolbar!: ColumnsToolbar
  private columnEditors: ColumnEditor[] = []
  private focusedColIndex = 0

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  private onTextSelection = (e: Event): void => {
    const { active } = (e as CustomEvent<{ active: boolean }>).detail
    if (active) {
      const sel = window.getSelection()
      if (sel && sel.rangeCount && this.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        this.toolbar.hide()
      }
    } else {
      if (this.contains(document.activeElement)) {
        const anchor = (document.activeElement as Element).closest<HTMLElement>('.pila-block')
        if (anchor && this.contains(anchor)) {
          this.toolbar.show(anchor, this.buildCtx())
        }
      }
    }
  }

  protected buildDOM(): void {
    this.classList.add('pila-columns-block')
    this.toolbar = new ColumnsToolbar()

    this.containerEl = document.createElement('div')
    this.containerEl.className = 'pila-columns'

    this.renderColumns(this.columnDefs())
    this.appendChild(this.containerEl)
    document.addEventListener('pila:text-selection', this.onTextSelection)
  }

  override updateData(block: Block): void {
    const wasActive  = this.contains(document.activeElement)
    const savedIndex = this.focusedColIndex
    super.updateData(block)
    if (this.containerEl) {
      this.destroyColumnEditors()
      this.renderColumns(this.columnDefs())
      if (wasActive) {
        this.columnEditors[Math.min(savedIndex, this.columnEditors.length - 1)]?.focusFirst()
      }
    }
  }

  override destroy(): void {
    document.removeEventListener('pila:text-selection', this.onTextSelection)
    this.toolbar.destroy()
    this.destroyColumnEditors()
    super.destroy()
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: { ...this.block.attrs, columnDefs: this.readDefs() },
    }
  }

  focusBlock(): void {
    this.columnEditors[0]?.focusFirst()
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private columnDefs(): ColumnDef[] {
    const defs = this.block.attrs?.columnDefs
    return defs && defs.length > 0
      ? defs
      : [{ blocks: [] }, { blocks: [] }]
  }

  private renderColumns(defs: ColumnDef[]): void {
    this.containerEl.innerHTML = ''
    this.columnEditors = []
    defs.forEach((def, idx) => {
      if (idx > 0) {
        this.containerEl.appendChild(this.buildResizeHandle(idx - 1))
      }
      this.containerEl.appendChild(this.buildColumn(def, idx))
    })

    // Wire keyboard-escape callbacks so ArrowUp on the first block of the
    // first column and ArrowDown on the last block of the last column move
    // focus to the block before/after the ColumnsBlock in the outer editor.
    if (this.columnEditors.length > 0) {
      this.columnEditors[0].onEscapeUp = () => this.focusOuterBlock('prev')
      this.columnEditors[this.columnEditors.length - 1].onEscapeDown = () => this.focusOuterBlock('next')
    }
  }

  private buildColumn(def: ColumnDef, idx: number): HTMLDivElement {
    const col = document.createElement('div')
    col.className        = 'pila-column'
    col.dataset.colIndex = String(idx)
    col.dataset.flexGrow = String(def.width ?? 1)
    col.style.flex       = `${def.width ?? 1} 1 0%`

    const editor = new ColumnEditor(def, this.ctx.placeholder)
    this.columnEditors[idx] = editor

    editor.el.addEventListener('focusin', (e: FocusEvent) => {
      this.focusedColIndex = idx
      // Anchor to the focused block element so the toolbar always appears near the cursor,
      // even when the column is tall with many blocks.
      const anchor = (e.target as Element)?.closest<HTMLElement>('.pila-block') ?? col
      this.toolbar.show(anchor, this.buildCtx())
    })

    editor.el.addEventListener('focusout', () => {
      // Defer so transient focus losses caused by DOM swaps (e.g. slash menu changing
      // a block type removes the old element from DOM, briefly sending focus to body)
      // don't permanently hide the toolbar before the new block is focused.
      setTimeout(() => {
        if (!this.contains(document.activeElement)) {
          this.toolbar.hide()
        }
      }, 150)
    })

    col.appendChild(editor.el)
    return col
  }

  /** Drag handle between two adjacent columns. */
  private buildResizeHandle(leftIdx: number): HTMLDivElement {
    const handle = document.createElement('div')
    handle.className   = 'pila-column-resize-handle'
    handle.title       = 'Drag to resize columns'

    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault()

      const cols       = this.columnEls()
      const colLeft    = cols[leftIdx]
      const colRight   = cols[leftIdx + 1]
      if (!colLeft || !colRight) return

      const startX        = e.clientX
      const startFlexL    = parseFloat(colLeft.dataset.flexGrow  ?? '1')
      const startFlexR    = parseFloat(colRight.dataset.flexGrow ?? '1')
      const totalFlex     = startFlexL + startFlexR
      const containerW    = this.containerEl.offsetWidth
      const startWidthL   = colLeft.offsetWidth

      const onMove = (me: MouseEvent) => {
        const dx          = me.clientX - startX
        const newWidthL   = startWidthL + dx
        const totalW      = colLeft.offsetWidth + colRight.offsetWidth || containerW
        // Clamp: each column keeps at least 15% of their combined width
        const ratio       = Math.max(0.15, Math.min(0.85, newWidthL / totalW))
        const newFlexL    = round2(totalFlex * ratio)
        const newFlexR    = round2(totalFlex * (1 - ratio))

        colLeft.dataset.flexGrow  = String(newFlexL)
        colRight.dataset.flexGrow = String(newFlexR)
        colLeft.style.flex        = `${newFlexL} 1 0%`
        colRight.style.flex       = `${newFlexR} 1 0%`
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup',   onUp)
        this.persistDefs()
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup',   onUp)
    })

    return handle
  }

  // ── Toolbar context ────────────────────────────────────────────────────────

  private buildCtx(): ColumnsToolbarContext {
    return {
      columnCount:     this.columnEls().length,
      focusedIndex:    this.focusedColIndex,
      onAddColLeft:    () => this.addColumn('left'),
      onAddColRight:   () => this.addColumn('right'),
      onDeleteCol:     () => this.deleteColumn(),
      onDeleteBlock:   () => this.ctx.manager.delete(this.block.id),
      onSetWidth:      (flex) => this.setColumnWidth(flex),
      getCurrentWidth: () => {
        const defs = this.block.attrs?.columnDefs ?? []
        return defs[this.focusedColIndex]?.width ?? 1
      },
    }
  }
  // ── Outer-editor focus helpers ───────────────────────────────────────────────

  private focusOuterBlock(direction: 'prev' | 'next'): void {
    const allBlocks = this.ctx.manager.getAll()
    const idx       = allBlocks.findIndex((b) => b.id === this.block.id)

    if (direction === 'prev' && idx > 0) {
      const targetId = allBlocks[idx - 1].id
      const targetEl = this.ctx.editorEl.querySelector<HTMLElement>(
        `[data-block-id="${targetId}"] [contenteditable], [data-block-id="${targetId}"] [tabindex]`
      )
      targetEl?.focus()
    } else if (direction === 'next') {
      if (idx < allBlocks.length - 1) {
        const targetId = allBlocks[idx + 1].id
        const targetEl = this.ctx.editorEl.querySelector<HTMLElement>(
          `[data-block-id="${targetId}"] [contenteditable], [data-block-id="${targetId}"] [tabindex]`
        )
        targetEl?.focus()
      } else {
        // ColumnsBlock is the last block — append a new paragraph and focus it.
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id })
        requestAnimationFrame(() => {
          const newEl = this.ctx.editorEl.querySelector<HTMLElement>(
            `[data-block-id="${newBlock.id}"] [contenteditable]`
          )
          newEl?.focus()
        })
      }
    }
  }
  // ── Column operations ──────────────────────────────────────────────────────

  private addColumn(position: 'left' | 'right'): void {
    const defs     = this.readDefs()
    const insertAt = position === 'left' ? this.focusedColIndex : this.focusedColIndex + 1
    defs.splice(insertAt, 0, {
      width: 1,
      blocks: [{ id: generateId(), type: 'paragraph', content: [] }],
    })
    this.focusedColIndex = insertAt
    this.saveDefs(defs)
  }

  private deleteColumn(): void {
    const defs = this.readDefs()
    if (defs.length <= 1) return
    defs.splice(this.focusedColIndex, 1)
    this.focusedColIndex = Math.max(0, this.focusedColIndex - 1)
    this.saveDefs(defs)
  }

  private setColumnWidth(flex: number): void {
    const defs = this.readDefs()
    if (!defs[this.focusedColIndex]) return
    defs[this.focusedColIndex] = { ...defs[this.focusedColIndex], width: flex }
    this.saveDefs(defs)
  }

  // ── Data helpers ───────────────────────────────────────────────────────────

  /** Read current column definitions from the live DOM. */
  private readDefs(): ColumnDef[] {
    return this.columnEls().map((col, idx) => ({
      width:  round2(parseFloat(col.dataset.flexGrow ?? '1') || 1),
      blocks: this.columnEditors[idx]?.getBlocks() ?? [],
    }))
  }

  private persistDefs(): void {
    this.ctx.manager.update(this.block.id, {
      attrs: { ...this.block.attrs, columnDefs: this.readDefs() },
    })
  }

  private saveDefs(defs: ColumnDef[]): void {
    this.ctx.manager.update(this.block.id, {
      attrs: { ...this.block.attrs, columnDefs: defs },
    })
  }

  // DOM helpers

  private columnEls(): HTMLDivElement[] {
    return Array.from(this.containerEl.querySelectorAll<HTMLDivElement>(':scope > .pila-column'))
  }

  private destroyColumnEditors(): void {
    this.columnEditors.forEach((ed) => ed.destroy())
    this.columnEditors = []
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

if (!customElements.get('pila-columns')) {
  customElements.define('pila-columns', ColumnsBlock)
}
