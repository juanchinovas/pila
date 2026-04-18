import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { Block, TableCell, TableRow } from '../types'
import { PilaBlock } from './PilaBlock'
import { TableToolbar, TableToolbarContext } from '../ui/TableToolbar'
import { icon, Icons } from '../ui/icons'

export class TableBlock extends PilaBlock {
  private tableEl!: HTMLTableElement
  private toolbar!: TableToolbar
  private focusedRow = 0
  private focusedCol = 0

  // Drag state
  private dragType: 'row' | 'col' | null = null
  private dragIndex = -1
  private dropIndex = -1

  private onTextSelection = (e: Event): void => {
    const { active } = (e as CustomEvent<{ active: boolean }>).detail
    if (active) {
      const sel = window.getSelection()
      if (sel && sel.rangeCount && this.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        this.toolbar.hide()
      }
    } else {
      if (this.contains(document.activeElement)) {
        const td = (document.activeElement as Element).closest<HTMLElement>('td, th')
        if (td) this.toolbar.show(td, this.buildCtx())
      }
    }
  }

  protected buildDOM(): void {
    this.classList.add('overflow-x-auto', 'my-1')
    this.toolbar = new TableToolbar()
    this.tableEl = this.buildTable(this.block.attrs?.rows ?? [])
    this.appendChild(this.tableEl)
    document.addEventListener('pila:text-selection', this.onTextSelection)
  }

  // ── Header helpers ──────────────────────────────────────────────────────────

  /** Returns the effective set of header row indices, migrating the legacy boolean if needed. */
  private headerRowSet(): number[] {
    const attrs = this.block.attrs ?? {}
    if (attrs.headerRows) return attrs.headerRows
    return attrs.headerRow ? [0] : []
  }

  /** Returns the effective set of header col indices, migrating the legacy boolean if needed. */
  private headerColSet(): number[] {
    const attrs = this.block.attrs ?? {}
    if (attrs.headerCols) return attrs.headerCols
    return attrs.headerCol ? [0] : []
  }

  // ── Table construction ────────────────────────────────────────────────────

  private buildTable(rows: TableRow[]): HTMLTableElement {
    const table = document.createElement('table')
    table.className = 'border-collapse w-full text-[0.9rem]'

    // Single delegated listeners for drag
    table.addEventListener('dragover', (e) => this.onTableDragOver(e))
    table.addEventListener('drop',     (e) => e.preventDefault())

    const headerRowSet = this.headerRowSet()
    const headerColSet = this.headerColSet()

    // Rows with headerRow index 0 go in <thead>, rest in <tbody>
    const hasTheadRows = headerRowSet.includes(0) && rows.length > 0
    if (hasTheadRows) {
      const thead = document.createElement('thead')
      const tbody = document.createElement('tbody')
      rows.forEach((row, rowIdx) => {
        const tr = this.buildRow(row, rowIdx, headerRowSet.includes(rowIdx), headerColSet)
        if (rowIdx === 0) thead.appendChild(tr)
        else             tbody.appendChild(tr)
      })
      table.appendChild(thead)
      table.appendChild(tbody)
    } else {
      rows.forEach((row, rowIdx) => {
        table.appendChild(this.buildRow(row, rowIdx, headerRowSet.includes(rowIdx), headerColSet))
      })
    }

    return table
  }

  private buildRow(
    row: TableRow,
    rowIdx: number,
    isHeaderRow: boolean,
    headerColSet: number[],
  ): HTMLTableRowElement {
    const tr = document.createElement('tr')
    tr.dataset.rowIndex = String(rowIdx)

    // ── Grip cell (row drag) ──────────────────────────────────────────────
    const gripTag = isHeaderRow ? 'th' : 'td'
    const gripTd  = document.createElement(gripTag)
    gripTd.className =
      'w-7 p-0 text-center border border-[var(--pila-border)] ' +
      'bg-[var(--pila-code-bg)] cursor-grab select-none group/row-grip'
    gripTd.draggable = true
    gripTd.title = 'Drag to reorder row'

    const rowGripIcon = icon(Icons.GripVertical, 14)
    rowGripIcon.setAttribute('aria-hidden', 'true')
    rowGripIcon.style.cssText =
      'display:block; margin:0 auto; color:var(--pila-muted); ' +
      'opacity:0.3; pointer-events:none; transition:opacity 0.15s'
    gripTd.addEventListener('mouseenter', () => { rowGripIcon.style.opacity = '0.7' })
    gripTd.addEventListener('mouseleave', () => { rowGripIcon.style.opacity = '0.3' })
    gripTd.appendChild(rowGripIcon)

    gripTd.addEventListener('dragstart', (e) => this.onRowDragStart(e, rowIdx))
    gripTd.addEventListener('dragend',   ()  => this.onDragEnd())
    tr.appendChild(gripTd)

    // ── Data cells ────────────────────────────────────────────────────────
    row.cells.forEach((cell, colIdx) => {
      const isHeaderCell = isHeaderRow || headerColSet.includes(colIdx)
      const tag  = isHeaderCell ? 'th' : 'td'
      const td   = document.createElement(tag)

      const alignClass =
        cell.align === 'center' ? 'text-center' :
        cell.align === 'right'  ? 'text-right'  : 'text-left'

      td.className = [
        'border border-[var(--pila-border)] p-0 min-w-[120px]',
        isHeaderCell ? 'bg-[var(--pila-code-bg)] font-semibold' : '',
        alignClass,
      ].filter(Boolean).join(' ')

      td.dataset.rowIndex = String(rowIdx)
      td.dataset.colIndex = String(colIdx)
      if (cell.align) td.dataset.align = cell.align

      // Column drag handle — only in the header row
      if (isHeaderRow) {
        const colGripWrap = document.createElement('div')
        colGripWrap.className = 'flex justify-center cursor-grab py-0.5'
        colGripWrap.draggable = true
        colGripWrap.title = 'Drag to reorder column'

        const colGripIcon = icon(Icons.GripVertical, 14)
        colGripIcon.setAttribute('aria-hidden', 'true')
        colGripIcon.style.cssText =
          'display:block; color:var(--pila-muted); ' +
          'opacity:0.3; pointer-events:none; transition:opacity 0.15s'
        colGripWrap.addEventListener('mouseenter', () => { colGripIcon.style.opacity = '0.7' })
        colGripWrap.addEventListener('mouseleave', () => { colGripIcon.style.opacity = '0.3' })
        colGripWrap.addEventListener('dragstart', (e) => this.onColDragStart(e, colIdx))
        colGripWrap.addEventListener('dragend',   ()  => this.onDragEnd())

        colGripWrap.appendChild(colGripIcon)
        td.appendChild(colGripWrap)
      }

      // Contenteditable cell content
      const cellEl = document.createElement('div')
      cellEl.setAttribute('contenteditable', 'true')
      cellEl.setAttribute('spellcheck', 'true')
      cellEl.className =
        `px-[10px] py-2 outline-none min-h-[1.4em] whitespace-pre-wrap break-words ${alignClass}`
      InlineRenderer.render(cellEl, cell.content)

      cellEl.addEventListener('focus', () => {
        this.focusedRow = rowIdx
        this.focusedCol = colIdx
        this.toolbar.show(td, this.buildCtx())
      })

      cellEl.addEventListener('blur', (e: FocusEvent) => {
        // Toolbar buttons use mousedown+preventDefault so blur won't fire when clicking them.
        // Only hide if focus moved completely outside this block.
        if (!this.contains(e.relatedTarget as Node | null)) {
          this.toolbar.hide()
        }
      })

      cellEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault()
          const all = Array.from(this.tableEl.querySelectorAll<HTMLElement>('[contenteditable]'))
          const idx  = all.indexOf(cellEl)
          const next = all[e.shiftKey ? idx - 1 : idx + 1]
          next?.focus()
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          this.handleArrow(e)
        }
      })

      td.appendChild(cellEl)
      tr.appendChild(td)
    })

    return tr
  }

  private buildCtx(): TableToolbarContext {
    return {
      headerRow: this.headerRowSet().includes(this.focusedRow),
      headerCol: this.headerColSet().includes(this.focusedCol),
      onToggleHeaderRow: () => this.toggleHeaderRow(),
      onToggleHeaderCol: () => this.toggleHeaderCol(),
      onAlign:           (a) => this.alignFocused(a),
      onAddRowAbove:     () => this.addRow('above'),
      onAddRowBelow:     () => this.addRow('below'),
      onAddColLeft:      () => this.addCol('left'),
      onAddColRight:     () => this.addCol('right'),
      onDeleteRow:       () => this.removeRow(),
      onDeleteCol:       () => this.removeCol(),
    }
  }

  // ── Drag: rows ────────────────────────────────────────────────────────────

  private onRowDragStart(e: DragEvent, rowIdx: number): void {
    this.dragType  = 'row'
    this.dragIndex = rowIdx
    this.dropIndex = -1
    e.dataTransfer?.setData('text/plain', `row:${rowIdx}`)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    ;(this.tableEl.querySelectorAll('tr')[rowIdx] as HTMLElement | undefined)
      ?.classList.add('opacity-40')
  }

  // ── Drag: columns ─────────────────────────────────────────────────────────

  private onColDragStart(e: DragEvent, colIdx: number): void {
    this.dragType  = 'col'
    this.dragIndex = colIdx
    this.dropIndex = -1
    e.dataTransfer?.setData('text/plain', `col:${colIdx}`)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation() // don't trigger row drag
  }

  // ── Drag: shared ──────────────────────────────────────────────────────────

  private onTableDragOver(e: DragEvent): void {
    if (!this.dragType) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'

    const target = e.target as Element

    if (this.dragType === 'row') {
      const tr = target.closest('tr') as HTMLTableRowElement | null
      if (!tr) return
      const rowIdx = parseInt(tr.dataset.rowIndex ?? '-1', 10)
      if (rowIdx < 0) return

      // Determine if hovering top or bottom half → insert before or after
      const rect = tr.getBoundingClientRect()
      const dropAfter = e.clientY > rect.top + rect.height / 2
      const newDropIndex = dropAfter ? rowIdx + 1 : rowIdx
      if (newDropIndex === this.dropIndex) return

      this.clearDropIndicator()
      this.dropIndex = newDropIndex

      if (dropAfter) {
        const allRows = Array.from(this.tableEl.querySelectorAll('tr'))
        const nextTr = allRows[rowIdx + 1] as HTMLTableRowElement | undefined
        if (nextTr) {
          nextTr.classList.add('pila-drop-above')
        } else {
          tr.classList.add('pila-drop-below')
        }
      } else {
        tr.classList.add('pila-drop-above')
      }

    } else if (this.dragType === 'col') {
      const td = target.closest('[data-col-index]') as HTMLElement | null
      if (!td) return
      const colIdx = parseInt(td.dataset.colIndex ?? '-1', 10)
      if (colIdx < 0) return

      // Determine if hovering left or right half → insert before or after
      const rect = td.getBoundingClientRect()
      const dropAfter = e.clientX > rect.left + rect.width / 2
      const newDropIndex = dropAfter ? colIdx + 1 : colIdx
      if (newDropIndex === this.dropIndex) return

      this.clearDropIndicator()
      this.dropIndex = newDropIndex

      const allRows = Array.from(this.tableEl.querySelectorAll('tr'))
      if (dropAfter) {
        const nextColIdx = colIdx + 1
        allRows.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td'))
          const nextCell = cells[nextColIdx + 1]
          if (nextCell) {
            nextCell.classList.add('pila-drop-left')
          } else {
            cells[colIdx + 1]?.classList.add('pila-drop-right')
          }
        })
      } else {
        allRows.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td'))
          cells[colIdx + 1]?.classList.add('pila-drop-left')
        })
      }
    }
  }

  private onDragEnd(): void {
    const from = this.dragIndex
    const to   = this.dropIndex
    const type = this.dragType
    this.clearDropIndicator()
    this.dragType  = null
    this.dragIndex = -1
    this.dropIndex = -1

    if (to < 0 || to === from || type === null) return

    const rows = this.currentRows()
    if (type === 'row') {
      const [moved] = rows.splice(from, 1)
      rows.splice(to > from ? to - 1 : to, 0, moved)
      this.saveRows(rows)
    } else {
      rows.forEach((row) => {
        const [moved] = row.cells.splice(from, 1)
        row.cells.splice(to > from ? to - 1 : to, 0, moved)
      })
      this.saveRows(rows)
    }
  }

  private clearDropIndicator(): void {
    const classes = ['pila-drop-above', 'pila-drop-below', 'pila-drop-left', 'pila-drop-right']
    classes.forEach((cls) => {
      this.tableEl.querySelectorAll<HTMLElement>(`.${cls}`).forEach((el) => el.classList.remove(cls))
    })
    this.tableEl.querySelectorAll<HTMLTableRowElement>('tr').forEach(
      (tr) => tr.classList.remove('opacity-40'),
    )
  }

  // ── Toolbar actions ───────────────────────────────────────────────────────

  private toggleHeaderRow(): void {
    const rows = this.currentRows()
    const set  = this.headerRowSet()
    const idx  = this.focusedRow
    const next = set.includes(idx) ? set.filter((r) => r !== idx) : [...set, idx].sort((a, b) => a - b)
    this.ctx.manager.update(this.block.id, {
      attrs: { ...this.block.attrs, rows, headerRows: next, headerRow: undefined },
    })
  }

  private toggleHeaderCol(): void {
    const rows = this.currentRows()
    const set  = this.headerColSet()
    const idx  = this.focusedCol
    const next = set.includes(idx) ? set.filter((c) => c !== idx) : [...set, idx].sort((a, b) => a - b)
    this.ctx.manager.update(this.block.id, {
      attrs: { ...this.block.attrs, rows, headerCols: next, headerCol: undefined },
    })
  }

  private alignFocused(align: 'left' | 'center' | 'right'): void {
    const rows = this.currentRows()
    const row  = rows[this.focusedRow]
    if (!row?.cells[this.focusedCol]) return
    row.cells[this.focusedCol] = { ...row.cells[this.focusedCol], align }
    this.saveRows(rows)
  }

  private addRow(position: 'above' | 'below'): void {
    const rows     = this.currentRows()
    const colCount = rows[0]?.cells.length ?? 3
    const newRow: TableRow = { cells: Array.from({ length: colCount }, () => ({ content: [] })) }
    const insertAt = position === 'above' ? this.focusedRow : this.focusedRow + 1
    rows.splice(insertAt, 0, newRow)
    this.focusedRow = insertAt
    this.saveRows(rows)
  }

  private addCol(position: 'left' | 'right'): void {
    const rows     = this.currentRows()
    const insertAt = position === 'left' ? this.focusedCol : this.focusedCol + 1
    rows.forEach((row) => row.cells.splice(insertAt, 0, { content: [] }))
    this.focusedCol = insertAt
    this.saveRows(rows)
  }

  private removeRow(): void {
    const rows = this.currentRows()
    if (rows.length <= 1) return
    rows.splice(this.focusedRow, 1)
    this.focusedRow = Math.max(0, this.focusedRow - 1)
    this.saveRows(rows)
  }

  private removeCol(): void {
    const rows     = this.currentRows()
    const colCount = rows[0]?.cells.length ?? 0
    if (colCount <= 1) return
    rows.forEach((row) => row.cells.splice(this.focusedCol, 1))
    this.focusedCol = Math.max(0, this.focusedCol - 1)
    this.saveRows(rows)
  }

  // ── Data helpers ──────────────────────────────────────────────────────────

  private currentRows(): TableRow[] {
    const rows: TableRow[] = []
    this.tableEl.querySelectorAll('tr').forEach((tr) => {
      // Skip the grip column (first th/td)
      const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td')).slice(1)
      if (cells.length === 0) return
      const rowCells: TableCell[] = cells.map((td) => {
        const cellEl  = td.querySelector('[contenteditable]') as HTMLElement
        const alignVal = td.dataset.align
        const align = (alignVal === 'left' || alignVal === 'center' || alignVal === 'right')
          ? alignVal as 'left' | 'center' | 'right'
          : undefined
        return { content: InlineParser.parse(cellEl), align }
      })
      rows.push({ cells: rowCells })
    })
    return rows
  }

  private saveRows(rows: TableRow[]): void {
    this.ctx.manager.update(this.block.id, {
      attrs: { ...this.block.attrs, rows },
    })
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override updateData(block: Block): void {
    const wasActive = this.contains(document.activeElement)
    const savedRow  = this.focusedRow
    const savedCol  = this.focusedCol
    super.updateData(block)
    if (this.tableEl) {
      const newTable = this.buildTable(block.attrs?.rows ?? [])
      this.tableEl.replaceWith(newTable)
      this.tableEl = newTable
    }
    if (wasActive) this.refocusCell(savedRow, savedCol)
  }

  private refocusCell(rowIdx: number, colIdx: number): void {
    const rows = Array.from(this.tableEl.querySelectorAll('tr'))
    const tr   = rows[Math.min(rowIdx, rows.length - 1)]
    if (!tr) return
    const cells = Array.from(tr.querySelectorAll<HTMLElement>('[contenteditable]'))
    const cell  = cells[Math.min(colIdx, cells.length - 1)]
    cell?.focus()
  }

  override destroy(): void {
    document.removeEventListener('pila:text-selection', this.onTextSelection)
    this.toolbar.destroy()
    super.destroy()
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: { ...this.block.attrs, rows: this.currentRows() },
    }
  }

  focusBlock(): void {
    const first = this.tableEl.querySelector<HTMLElement>('[contenteditable]')
    first?.focus()
  }
}

if (!customElements.get('pila-table')) {
  customElements.define('pila-table', TableBlock)
}
