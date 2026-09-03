import { InlineParser } from '../inline/InlineParser';
import { InlineRenderer } from '../inline/InlineRenderer';
import { Block, BlockAttrs, TableCell, TableRow } from '../types';
import { PilaBlock } from './PilaBlock';
import { BlockAction, BlockPopover } from '../ui/BlockPopover';
import { icon, Icons } from '../ui/icons';
import { setPortalPosition } from '../ui/overlayPosition';

export class TableBlock extends PilaBlock {
  private tableEl!: HTMLTableElement;
  private focusedRow = 0;
  private focusedCol = 0;

  get colorOptions(): boolean {
    return false;
  }

  // Hover Handles
  private rowHandle: HTMLDivElement | null = null;
  private colHandle: HTMLDivElement | null = null;
  private hideTimeout: NodeJS.Timeout | null = null;

  // Drag state
  private dragType: 'row' | 'col' | null = null;
  private dragIndex = -1;
  private dropIndex = -1;

  // Selection state for merging
  private selectionStart: { r: number, c: number } | null = null;
  private selectionEnd: { r: number, c: number } | null = null;
  private isSelecting = false;
  private cellSettingsBtn: HTMLDivElement | null = null;
  private suppressBlurSave = false;

  protected buildDOM(): void {
    this.classList.add('overflow-x-auto', '!my-5');
    this.dataset.isParentBlock = 'true';
    
    this.tableEl = this.buildTable(this.block.attrs?.rows ?? []);
    this.appendChild(this.tableEl);

    this.eventGroup.on(this, 'mouseleave', () => {
      this.scheduleHide();
    });
  }

  private scheduleHide(): void {
    this.clearHideTimeout();
    this.hideTimeout = setTimeout(() => this.hideHandles(), 100);
  }

  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private hideHandles(): void {
    if (this.rowHandle) this.rowHandle.style.display = 'none';
    if (this.colHandle) this.colHandle.style.display = 'none';
    if (this.cellSettingsBtn) this.cellSettingsBtn.style.display = 'none';
  }

  private showColHandle(colIdx: number, td: HTMLElement): void {
    if (!this.colHandle) {
      this.colHandle = document.createElement('div');
      this.colHandle.className = 'pila-table-handle hover:bg-gray-500/100 h-2';
      this.colHandle.appendChild(icon(Icons.MoreHorizontal, 14));
      this.colHandle.draggable = true;
      this.eventGroup.on(this.colHandle, 'dragstart', (e) => this.onColDragStart(e, this.focusedCol));
      this.eventGroup.on(this.colHandle, 'dragend', () => this.onDragEnd());
      // Use click instead of mousedown to allow drag-start on mousedown
      this.eventGroup.on(this.colHandle, 'click', (e) => {
        e.stopPropagation();
        this.openColMenu(e.clientX, e.clientY);
      });
      this.eventGroup.on(this.colHandle, 'mouseenter', () => this.clearHideTimeout());
      this.eventGroup.on(this.colHandle, 'mouseleave', () => this.scheduleHide());
      
      this.ctx.portalTo?.appendChild(this.colHandle);
    }

    const tableRect = this.tableEl.getBoundingClientRect();
    const cellRect = td.getBoundingClientRect();
    
    this.colHandle.style.display = 'flex';
    // Position at the very top of the table, centered horizontally on the column
    setPortalPosition(this.colHandle, this.ctx.portalTo ?? document.body, cellRect.left, tableRect.top - 10);
    this.colHandle.style.width = `${cellRect.width}px`;
    // this.colHandle.style.height = '24px'

    this.focusedCol = colIdx;
    this.clearHideTimeout();
  }

  private showRowHandle(rowIdx: number, tr: HTMLTableRowElement): void {
    if (!this.rowHandle) {
      this.rowHandle = document.createElement('div');
      this.rowHandle.className = 'pila-table-handle hover:bg-gray-500/100 w-2';
      this.rowHandle.appendChild(icon(Icons.MoreVertical, 14));
      this.rowHandle.draggable = true;
      this.eventGroup.on(this.rowHandle, 'dragstart', (e) => this.onRowDragStart(e, this.focusedRow));
      this.eventGroup.on(this.rowHandle, 'dragend', () => this.onDragEnd());
      this.eventGroup.on(this.rowHandle, 'click', (e) => {
        e.stopPropagation();
        this.openRowMenu(e.clientX, e.clientY); 
      });
      this.eventGroup.on(this.rowHandle, 'mouseenter', () => this.clearHideTimeout());
      this.eventGroup.on(this.rowHandle, 'mouseleave', () => this.scheduleHide());
      this.ctx.portalTo?.appendChild(this.rowHandle);
    }

    const rect = tr.getBoundingClientRect();
    this.rowHandle.style.display = 'flex';
    setPortalPosition(this.rowHandle, this.ctx.portalTo ?? document.body, rect.left - 10, rect.top);
    this.rowHandle.style.height = `${rect.height}px`;

    this.focusedRow = rowIdx;
    this.clearHideTimeout();
  }

  private showCellSettings(r: number, c: number, td: HTMLElement): void {
    if (!this.cellSettingsBtn) {
      this.cellSettingsBtn = document.createElement('div');
      this.cellSettingsBtn.className = 'pila-table-handle w-5 h-5 !p-0';
      this.cellSettingsBtn.style.position = 'absolute';
      this.cellSettingsBtn.style.zIndex = '9001';
      this.cellSettingsBtn.appendChild(icon(Icons.Settings2, 12));
      this.eventGroup.on(this.cellSettingsBtn, 'click', (e) => {
        e.stopPropagation();
        this.openCellPopover(e.clientX, e.clientY);
      });
      this.eventGroup.on(this.cellSettingsBtn, 'mouseenter', () => this.clearHideTimeout());
      this.eventGroup.on(this.cellSettingsBtn, 'mouseleave', () => this.scheduleHide());
      this.ctx.portalTo?.appendChild(this.cellSettingsBtn);
    }

    const rect = td.getBoundingClientRect();
    this.cellSettingsBtn.style.display = 'flex';
    // Position at top-right of cell
    setPortalPosition(this.cellSettingsBtn, this.ctx.portalTo ?? document.body, rect.right - 22, rect.top + 2);
    
    this.focusedRow = r;
    this.focusedCol = c;
    this.clearHideTimeout();
  }

  private openCellPopover(x: number, y: number): void {
    const popover = new BlockPopover(this.ctx.portalTo);
    const rows = this.currentRows();
    const cell = rows[this.focusedRow]?.cells[this.focusedCol];

    popover.open(x, y, [
      { label: 'Align left', type: 'action', value: 'left', icon: 'AlignLeft', handler: (ev: CustomEvent<BlockAction>) => this.setCellStyle({ align: ev.detail.value as 'left' }) },
      { label: 'Align center', type: 'action', value: 'center', icon: 'AlignCenter', handler: (ev: CustomEvent<BlockAction>) => this.setCellStyle({ align: ev.detail.value as 'center' }) },
      { label: 'Align right', type: 'action', value: 'right', icon: 'AlignRight', handler: (ev: CustomEvent<BlockAction>) => this.setCellStyle({ align: ev.detail.value as 'right' }) },
      { label: 'Background', type: 'color', icon: 'Paintbucket', value: cell.background, handler: (ev: CustomEvent<BlockAction>) => this.setCellStyle({ background: String(ev.detail.value) }) },
      { label: 'Text color', type: 'color', icon: 'Palette', value: cell.color, handler: (ev: CustomEvent<BlockAction>) => this.setCellStyle({ color: String(ev.detail.value) }) },
      { label: 'Clear styling', type: 'action', icon: 'Eraser', handler: () => this.setCellStyle({ background: '', color: '', align: undefined }) },
    ]);
  }

  private onStartResize(e: MouseEvent, colIdx: number, td: HTMLElement): void {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = td.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      
      // Update all cells in this column
      const allRows = Array.from(this.tableEl.querySelectorAll('tr'));
      allRows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td'));
        const cell = cells[colIdx];
        if (cell) cell.style.width = `${newWidth}px`;
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.saveRows(this.currentRows());
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private openRowMenu(x: number, y: number): void {
    const popover = new BlockPopover(this.ctx.portalTo);
    const actions: BlockAction[] = [
      { label: 'Toggle row as header', type: 'action' , icon: 'Rows2', handler: () => this.toggleHeaderRow() },
      { label: 'Add row above', type: 'action', value: 'above', icon: 'ArrowUpToLine', handler: (ev: CustomEvent<BlockAction>) => this.addRow(ev.detail.value as 'above') },
      { label: 'Add row below', type: 'action', value: 'below', icon: 'ArrowDownToLine', handler: (ev: CustomEvent<BlockAction>) => this.addRow(ev.detail.value as 'below') },
      { label: 'Align left', type: 'action', value: 'left', icon: 'AlignLeft', handler: (ev: CustomEvent<BlockAction>) => this.setRowStyle({ align: ev.detail.value as 'left' }) },
      { label: 'Align center', type: 'action', value: 'center', icon: 'AlignCenter', handler: (ev: CustomEvent<BlockAction>) => this.setRowStyle({ align: ev.detail.value as 'center' }) },
      { label: 'Align right', type: 'action', value: 'right', icon: 'AlignRight', handler: (ev: CustomEvent<BlockAction>) => this.setRowStyle({ align: ev.detail.value as 'right' }) },
      { label: 'Background', type: 'color', value: '', icon: 'Paintbucket', handler: (e: CustomEvent<BlockAction>) => this.setRowStyle({ background: String(e.detail.value) }) },
      { label: 'Text color', type: 'color', value: '', icon: 'Palette', handler: (e: CustomEvent<BlockAction>) => this.setRowStyle({ color: String(e.detail.value) }) },
      { label: 'Clear styling', type: 'action', icon: 'Eraser', handler: () => this.setRowStyle({ background: '', color: '', align: undefined }) },
      { label: 'Delete row', type: 'action', icon: 'Trash2', danger: true, handler: () => this.removeRow() },
    ];

    if (this.hasSelection()) {
      actions.splice(actions.length - 1, 0, { label: 'Merge cells', type: 'action', icon: 'Table2', handler: () => this.mergeSelected() });
    } else if (this.isFocusedCellMerged()) {
      actions.splice(actions.length - 1, 0, { label: 'Unmerge cells', type: 'action', icon: 'Grid', handler: () => this.unmergeFocused() });
    }

    popover.open(x, y, actions);
  }

  private openColMenu(x: number, y: number): void {
    const popover = new BlockPopover(this.ctx.portalTo);
    const actions: BlockAction[] = [
      { label: 'Toggle column as header', type: 'action', icon: 'Columns2', handler: () => this.toggleHeaderCol() },
      { label: 'Add column left', type: 'action', value: 'left', icon: 'ArrowLeftToLine', handler: (ev: CustomEvent<BlockAction>) => this.addCol(ev.detail.value as 'left') },
      { label: 'Add column right', type: 'action', value: 'right', icon: 'ArrowRightToLine', handler: (ev: CustomEvent<BlockAction>) => this.addCol(ev.detail.value as 'right') },
      { label: 'Align left', type: 'action', value: 'left', icon: 'AlignLeft', handler: (ev: CustomEvent<BlockAction>) => this.setColStyle({ align: ev.detail.value as 'left' }) },
      { label: 'Align center', type: 'action', value: 'center', icon: 'AlignCenter', handler: (ev: CustomEvent<BlockAction>) => this.setColStyle({ align: ev.detail.value as 'center' }) },
      { label: 'Align right', type: 'action', value: 'right', icon: 'AlignRight', handler: (ev: CustomEvent<BlockAction>) => this.setColStyle({ align: ev.detail.value as 'right' }) },
      { label: 'Background', type: 'color', value: '', icon: 'Paintbucket', handler: (e: CustomEvent<BlockAction>) => this.setColStyle({ background: String(e.detail.value) }) },
      { label: 'Text color', type: 'color', value: '', icon: 'Palette', handler: (e: CustomEvent<BlockAction>) => this.setColStyle({ color: String(e.detail.value) }) },
      { label: 'Clear styling', type: 'action', icon: 'Eraser', handler: () => this.setColStyle({ background: '', color: '', align: undefined }) },
      { label: 'Delete column', type: 'action', icon: 'Trash2', danger: true, handler: () => this.removeCol() },
    ];

    if (this.hasSelection()) {
      actions.splice(actions.length - 1, 0, { label: 'Merge cells', type: 'action', icon: 'Table2', handler: () => this.mergeSelected() });
    } else if (this.isFocusedCellMerged()) {
      actions.splice(actions.length - 1, 0, { label: 'Unmerge cells', type: 'action', icon: 'Grid', handler: () => this.unmergeFocused() });
    }

    popover.open(x, y, actions);
  }

  private hasSelection(): boolean {
    if (!this.selectionStart || !this.selectionEnd) return false;
    return this.selectionStart.r !== this.selectionEnd.r || this.selectionStart.c !== this.selectionEnd.c;
  }

  private isFocusedCellMerged(): boolean {
    const rows = this.currentRows();
    const cell = rows[this.focusedRow]?.cells[this.focusedCol];
    return !!(cell?.colspan || cell?.rowspan);
  }

  private onTableMouseDown(e: MouseEvent): void {
    const td = (e.target as HTMLElement).closest('td, th') as HTMLElement;
    if (!td) return;

    const r = parseInt(td.dataset.rowIndex || '0', 10);
    const c = parseInt(td.dataset.colIndex || '0', 10);

    this.isSelecting = true;
    this.selectionStart = { r, c };
    this.selectionEnd = { r, c };
    this.updateSelectionUI();
  }

  private onCellMouseEnter(r: number, c: number): void {
    if (!this.isSelecting) return;
    this.selectionEnd = { r, c };
    this.updateSelectionUI();
  }

  private onTableMouseUp(e?: MouseEvent): void {
    // If a mouseup event is provided and a selection is in progress,
    // try to resolve the cell under the cursor to update selectionEnd.
    if (e && this.isSelecting) {
      const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
      const td = el?.closest('td, th') as HTMLElement | null;
      if (td) {
        const r = parseInt(td.dataset.rowIndex || '0', 10);
        const c = parseInt(td.dataset.colIndex || '0', 10);
        this.selectionEnd = { r, c };
      }
    }

    this.isSelecting = false;
    // Ensure UI reflects any final selection position
    this.updateSelectionUI();
  }

  private updateSelectionUI(): void {
    const cells = Array.from(this.tableEl.querySelectorAll('td, th'));
    cells.forEach(cell => (cell as HTMLElement).classList.remove('pila-cell-selected'));

    if (!this.selectionStart || !this.selectionEnd) return;

    const r1 = Math.min(this.selectionStart.r, this.selectionEnd.r);
    const r2 = Math.max(this.selectionStart.r, this.selectionEnd.r);
    const c1 = Math.min(this.selectionStart.c, this.selectionEnd.c);
    const c2 = Math.max(this.selectionStart.c, this.selectionEnd.c);

    cells.forEach(cell => {
      const td = cell as HTMLElement;
      const r = parseInt(td.dataset.rowIndex || '0', 10);
      const c = parseInt(td.dataset.colIndex || '0', 10);
      if (r >= r1 && r <= r2 && c >= c1 && c <= c2) {
        td.classList.add('pila-cell-selected');
      }
    });
  }

  private mergeSelected(): void {
    if (!this.selectionStart || !this.selectionEnd) return;
    
    const r1 = Math.min(this.selectionStart.r, this.selectionEnd.r);
    const r2 = Math.max(this.selectionStart.r, this.selectionEnd.r);
    const c1 = Math.min(this.selectionStart.c, this.selectionEnd.c);
    const c2 = Math.max(this.selectionStart.c, this.selectionEnd.c);

    if (r1 === r2 && c1 === c2) return;

    const rows = this.currentRows();
    const targetCell = rows[r1].cells[c1];
    
    // Combine content
    const combinedContent: { text: string }[] = [...targetCell.content];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r === r1 && c === c1) continue;
        const cell = rows[r].cells[c];
        if (cell.content.length > 0) {
          combinedContent.push({ text: ' ' }, ...cell.content);
        }
      }
    }

    targetCell.content = combinedContent;
    targetCell.colspan = (c2 - c1) + 1;
    targetCell.rowspan = (r2 - r1) + 1;

    // Mark all other cells in range as hidden slaves of the target
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r === r1 && c === c1) continue;
        rows[r].cells[c] = { content: [], mergedTo: { row: r1, col: c1 } };
      }
    }

    this.persistStructuralRows(rows);
    this.selectionStart = null;
    this.selectionEnd = null;
    this.updateSelectionUI();
  }

  private unmergeFocused(): void {
    const rows = this.currentRows();
    const targetCell = rows[this.focusedRow]?.cells[this.focusedCol];
    if (!targetCell || (!targetCell.colspan && !targetCell.rowspan)) return;

    const rs = targetCell.rowspan || 1;
    const cs = targetCell.colspan || 1;

    // Clear mergedTo on all slave cells
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        if (dr === 0 && dc === 0) continue;
        const slave = rows[this.focusedRow + dr]?.cells[this.focusedCol + dc];
        if (slave) slave.mergedTo = undefined;
      }
    }

    delete targetCell.colspan;
    delete targetCell.rowspan;

    this.persistStructuralRows(rows);
  }

  private setCellStyle(style: { background?: string, color?: string, align?: 'left' | 'center' | 'right' }): void {
    const rows = this.currentRows();
    const cell = rows[this.focusedRow]?.cells[this.focusedCol];
    if (!cell) return;
    if (style.background !== undefined) cell.background = style.background;
    if (style.color !== undefined) cell.color = style.color;
    if ('align' in style) cell.align = style.align;
    this.saveRows(rows);
  }

  private setRowStyle(style: { background?: string, color?: string, align?: 'left' | 'center' | 'right' }): void {
    const rows = this.currentRows();
    const row = rows[this.focusedRow];
    if (!row) return;
    row.cells.forEach(cell => {
      if (style.background !== undefined) cell.background = style.background;
      if (style.color !== undefined) cell.color = style.color;
      if ('align' in style) cell.align = style.align;
    });
    this.saveRows(rows);
  }

  private setColStyle(style: { background?: string, color?: string, align?: 'left' | 'center' | 'right' }): void {
    const rows = this.currentRows();
    rows.forEach(row => {
      const cell = row.cells[this.focusedCol];
      if (cell) {
        if (style.background !== undefined) cell.background = style.background;
        if (style.color !== undefined) cell.color = style.color;
        if ('align' in style) cell.align = style.align;
      }
    });
    this.saveRows(rows);
  }

  // ── Header helpers ──────────────────────────────────────────────────────────

  /** Returns the effective set of header row indices, migrating the legacy boolean if needed. */
  private headerRowSet(): number[] {
    const attrs = this.block.attrs ?? {};
    if (attrs.headerRows) return attrs.headerRows;
  
    return attrs.headerRow ? [0] : [];
  }

  /** Returns the effective set of header col indices, migrating the legacy boolean if needed. */
  private headerColSet(): number[] {
    const attrs = this.block.attrs ?? {};
    if (attrs.headerCols) return attrs.headerCols;

    return attrs.headerCol ? [0] : [];
  }

  // ── Table construction ────────────────────────────────────────────────────

  private buildTable(rows: TableRow[]): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'border-collapse w-full text-[0.9rem] mt-5';

    // Single delegated listeners for drag
    this.eventGroup.on(table, 'dragover', (e) => this.onTableDragOver(e));
    this.eventGroup.on(table, 'drop', (e) => e.preventDefault());

    // Cell selection listeners
    this.eventGroup.on(table, 'mousedown', (e) => this.onTableMouseDown(e));
    // Capture mouseup coordinates so we can finalize selection even when
    // cell mouseenter isn't fired (e.g. synthetic drags in tests).
    this.eventGroup.on(window, 'mouseup', (e) => this.onTableMouseUp(e as MouseEvent));

    const headerRowSet = this.headerRowSet();
    const headerColSet = this.headerColSet();

    // Rows with headerRow index 0 go in <thead>, rest in <tbody>
    const hasTheadRows = headerRowSet.includes(0) && rows.length > 0;
    if (hasTheadRows) {
      rows.forEach((row, rowIdx) => {
        const tr = this.buildRow(row, rowIdx, headerRowSet.includes(rowIdx), headerColSet);
        if (rowIdx === 0) {
          table.appendChild(tr);
        }
        else {
          table.appendChild(tr);
        }
      });
    } else {
      rows.forEach((row, rowIdx) => {
        table.appendChild(this.buildRow(row, rowIdx, headerRowSet.includes(rowIdx), headerColSet));
      });
    }

    return table;
  }

  private buildRow(
    row: TableRow,
    rowIdx: number,
    isHeaderRow: boolean,
    headerColSet: number[],
  ): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.dataset.rowIndex = String(rowIdx);
    tr.addEventListener('mouseenter', () => this.showRowHandle(rowIdx, tr));

    // Data cells
    row.cells.forEach((cell, colIdx) => {
      if (cell.mergedTo) return; // hidden by a merged cell
      const isHeaderCell = isHeaderRow || headerColSet.includes(colIdx);
      const tag  = isHeaderCell ? 'th' : 'td';
      const td   = document.createElement(tag);

      const alignClass =
        cell.align === 'center' ? 'text-center' :
        cell.align === 'right'  ? 'text-right'  : 'text-left';

      td.className = [
        'border border-[var(--pila-border)] p-0 min-w-[120px] transition-colors',
        isHeaderCell ? 'bg-[var(--pila-code-bg)] font-semibold' : '',
        alignClass,
      ].filter(Boolean).join(' ');

      if (cell.background) td.style.backgroundColor = cell.background;
      if (cell.color) td.style.color = cell.color;

      td.dataset.rowIndex = String(rowIdx);
      td.dataset.colIndex = String(colIdx);
      if (cell.align) td.dataset.align = cell.align;
      if (cell.colspan) td.setAttribute('colspan', String(cell.colspan));
      if (cell.rowspan) td.setAttribute('rowspan', String(cell.rowspan));

      // Resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--pila-accent)] opacity-0 hover:opacity-100 transition-opacity z-10';
      resizeHandle.addEventListener('mousedown', (e) => this.onStartResize(e, colIdx, td));
      td.appendChild(resizeHandle);
      td.classList.add('relative');

      td.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        this.showRowHandle(rowIdx, tr);
        this.showColHandle(colIdx, td);
        this.showCellSettings(rowIdx, colIdx, td);
        this.onCellMouseEnter(rowIdx, colIdx);
      });

      // Contenteditable cell content
      const cellEl = document.createElement('p');
      cellEl.classList.add('pila-block');
      cellEl.setAttribute('contenteditable', 'true');
      cellEl.setAttribute('spellcheck', 'true');
      cellEl.setAttribute('data-block-id', `${this.block.id!}_cell_${rowIdx}_${colIdx}`);
      cellEl.className =
        `px-[10px] py-2 outline-none min-h-[1.4em] whitespace-pre-wrap break-words ${alignClass}`;
      InlineRenderer.render(cellEl, cell.content);

      if (cell.width) td.style.width = cell.width;

      cellEl.addEventListener('focus', () => {
        this.focusedRow = rowIdx;
        this.focusedCol = colIdx;
      });

      cellEl.addEventListener('blur', () => {
        // High frequency save to keep FloatingToolbar and Serializers in sync
        if (this.suppressBlurSave) return;
        this.saveRows(this.currentRows());
      });

      cellEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const all = Array.from(this.tableEl.querySelectorAll<HTMLElement>('[contenteditable]'));
          const idx  = all.indexOf(cellEl);
          const next = all[e.shiftKey ? idx - 1 : idx + 1];
          next?.focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          this.handleArrow(e);
        }
      });

      td.appendChild(cellEl);
      tr.appendChild(td);
    });

    return tr;
  }

  // ── Drag: rows ────────────────────────────────────────────────────────────

  private onRowDragStart(e: DragEvent, rowIdx: number): void {
    this.dragType  = 'row';
    this.dragIndex = rowIdx;
    this.dropIndex = -1;
    e.dataTransfer?.setData('text/plain', `row:${rowIdx}`);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    ;(this.tableEl.querySelectorAll('tr')[rowIdx] as HTMLElement | undefined)
      ?.classList.add('opacity-40');
  }

  // ── Drag: columns ─────────────────────────────────────────────────────────

  private onColDragStart(e: DragEvent, colIdx: number): void {
    this.dragType  = 'col';
    this.dragIndex = colIdx;
    this.dropIndex = -1;
    e.dataTransfer?.setData('text/plain', `col:${colIdx}`);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    
    // Highlight the column being dragged
    const allRows = Array.from(this.tableEl.querySelectorAll('tr'));
    allRows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td'));
      cells[colIdx]?.classList.add('opacity-40');
    });
    e.stopPropagation(); // don't trigger row drag
  }

  // ── Drag: shared ──────────────────────────────────────────────────────────

  private onTableDragOver(e: DragEvent): void {
    if (!this.dragType) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const target = e.target as Element;

    if (this.dragType === 'row') {
      const tr = target.closest('tr') as HTMLTableRowElement | null;
      if (!tr) return;
      const rowIdx = parseInt(tr.dataset.rowIndex ?? '-1', 10);
      if (rowIdx < 0) return;

      // Determine if hovering top or bottom half → insert before or after
      const rect = tr.getBoundingClientRect();
      const dropAfter = e.clientY > rect.top + rect.height / 2;
      const newDropIndex = dropAfter ? rowIdx + 1 : rowIdx;
      if (newDropIndex === this.dropIndex) return;

      this.clearDropIndicator();
      this.dropIndex = newDropIndex;

      if (dropAfter) {
        tr.classList.add('pila-drop-below');
      } else {
        tr.classList.add('pila-drop-above');
      }

    } else if (this.dragType === 'col') {
      const td = target.closest('[data-col-index]') as HTMLElement | null;
      if (!td) return;
      const colIdx = parseInt(td.dataset.colIndex ?? '-1', 10);
      if (colIdx < 0) return;

      // Determine if hovering left or right half → insert before or after
      const rect = td.getBoundingClientRect();
      const dropAfter = e.clientX > rect.left + rect.width / 2;
      const newDropIndex = dropAfter ? colIdx + 1 : colIdx;
      if (newDropIndex === this.dropIndex) return;

      this.clearDropIndicator();
      this.dropIndex = newDropIndex;

      const allRows = Array.from(this.tableEl.querySelectorAll('tr'));
      allRows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td'));
        if (dropAfter) {
          // If dropAfter, highlight the right border of the current cell
          cells[colIdx]?.classList.add('pila-drop-right');
        } else {
          // If dropBefore, highlight the left border of the current cell
          cells[colIdx]?.classList.add('pila-drop-left');
        }
      });
    }
  }

  private onDragEnd(): void {
    const from = this.dragIndex;
    const to   = this.dropIndex;
    const type = this.dragType;
    this.clearDropIndicator();
    this.dragType  = null;
    this.dragIndex = -1;
    this.dropIndex = -1;

    if (to < 0 || to === from || type === null) return;

    const rows = this.currentRows();
    if (type === 'row') {
      const [moved] = rows.splice(from, 1);
      rows.splice(to > from ? to - 1 : to, 0, moved);
      this.saveRows(rows);
    } else {
      rows.forEach((row) => {
        const [moved] = row.cells.splice(from, 1);
        row.cells.splice(to > from ? to - 1 : to, 0, moved);
      });
      this.saveRows(rows);
    }
  }

  private clearDropIndicator(): void {
    const classes = ['pila-drop-above', 'pila-drop-below', 'pila-drop-left', 'pila-drop-right', 'opacity-40'];
    classes.forEach((cls) => {
      this.tableEl.querySelectorAll<HTMLElement>(`.${cls}`).forEach((el) => el.classList.remove(cls));
    });
  }

  // ── Toolbar actions ───────────────────────────────────────────────────────

  private toggleHeaderRow(): void {
    const rows = this.currentRows();
    const set  = this.headerRowSet();
    const idx  = this.focusedRow;
    const next = set.includes(idx) ? set.filter((r) => r !== idx) : [...set, idx].sort((a, b) => a - b);

    this.persistStructuralRows(rows, { headerRows: next, headerRow: undefined });
  }

  private toggleHeaderCol(): void {
    const rows = this.currentRows();
    const set  = this.headerColSet();
    const idx  = this.focusedCol;
    const next = set.includes(idx) ? set.filter((c) => c !== idx) : [...set, idx].sort((a, b) => a - b);

    this.persistStructuralRows(rows, { headerCols: next, headerCol: undefined });
  }

  private removeCol(): void {
    const rows     = this.currentRows();
    const colCount = rows[0]?.cells.length ?? 0;
    if (colCount <= 1) return;
    rows.forEach((row) => row.cells.splice(this.focusedCol, 1));
    this.focusedCol = Math.max(0, this.focusedCol - 1);
    this.persistStructuralRows(rows);
  }

  private addRow(position: 'above' | 'below'): void {
    const rows     = this.currentRows();
    const colCount = rows[0]?.cells.length ?? 3;
    const newRow: TableRow = { cells: Array.from({ length: colCount }, () => ({ content: [] })) };
    const insertAt = position === 'above' ? this.focusedRow : this.focusedRow + 1;
    rows.splice(insertAt, 0, newRow);
    this.focusedRow = insertAt;
    this.persistStructuralRows(rows);
  }

  private addCol(position: 'left' | 'right'): void {
    const rows     = this.currentRows();
    const insertAt = position === 'left' ? this.focusedCol : this.focusedCol + 1;
    rows.forEach((row) => row.cells.splice(insertAt, 0, { content: [] }));
    this.focusedCol = insertAt;
    this.persistStructuralRows(rows);
  }

  private removeRow(): void {
    const rows = this.currentRows();
    if (rows.length <= 1) return;
    rows.splice(this.focusedRow, 1);
    this.focusedRow = Math.max(0, this.focusedRow - 1);
    this.persistStructuralRows(rows);
  }

  // ── Data helpers ──────────────────────────────────────────────────────────

  private currentRows(): TableRow[] {
    const domRows: TableRow[] = [];
    this.tableEl.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll<HTMLElement>('th, td'));
      if (cells.length === 0) {
        domRows.push({ cells: [] });
        return;
      }
      const rowCells: TableCell[] = cells.map((td) => {
        const cellEl  = td.querySelector('[contenteditable]') as HTMLElement;
        const alignVal = td.dataset.align;
        const align = (alignVal === 'left' || alignVal === 'center' || alignVal === 'right')
          ? alignVal as 'left' | 'center' | 'right'
          : undefined;
        return {
          content: InlineParser.parse(cellEl),
          align,
          background: td.style.backgroundColor || undefined,
          color: td.style.color || undefined,
          width: td.style.width || undefined,
          colspan: td.getAttribute('colspan') ? parseInt(td.getAttribute('colspan')!, 10) : undefined,
          rowspan: td.getAttribute('rowspan') ? parseInt(td.getAttribute('rowspan')!, 10) : undefined,
        };
      });
      domRows.push({ cells: rowCells });
    });

    // Expand sparse DOM representation into a full rectangular grid,
    // injecting hidden mergedTo cells for positions covered by colspan/rowspan
    const grid: TableCell[][] = [];

    for (let r = 0; r < domRows.length; r++) {
      if (!grid[r]) grid[r] = [];
      let virCol = 0;

      for (let dc = 0; dc < domRows[r].cells.length; dc++) {
        while (grid[r][virCol]) virCol++;

        const cell = { ...domRows[r].cells[dc] };
        const cs = cell.colspan || 1;
        const rs = cell.rowspan || 1;

        grid[r][virCol] = cell;

        for (let dr = 0; dr < rs; dr++) {
          for (let dc2 = 0; dc2 < cs; dc2++) {
            if (dr === 0 && dc2 === 0) continue;
            const tr = r + dr;
            const tc = virCol + dc2;
            if (!grid[tr]) grid[tr] = [];
            grid[tr][tc] = { content: [], mergedTo: { row: r, col: virCol } };
          }
        }

        virCol += cs;
      }
    }

    const result: TableRow[] = [];
    for (let r = 0; r < grid.length; r++) {
      const cells: TableCell[] = [];
      for (let c = 0; c < grid[r].length; c++) {
        cells.push(grid[r][c] || { content: [] });
      }
      result.push({ cells });
    }
    return result;
  }

  private saveRows(rows: TableRow[]): void {
    this.ctx.manager.update(this.block.id!, {
      attrs: { ...this.block.attrs, rows },
    });
  }

  private persistStructuralRows(rows: TableRow[], attrOverrides: Partial<BlockAttrs> = {}): void {
    this.suppressBlurSave = true;
    this.ctx.manager.update(this.block.id!, {
      attrs: { ...this.block.attrs, rows, ...attrOverrides },
    });

    requestAnimationFrame(() => {
      this.suppressBlurSave = false;
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override updateData(block: Block): void {
    const wasActive = this.contains(document.activeElement);
    const savedRow  = this.focusedRow;
    const savedCol  = this.focusedCol;
    super.updateData(block);
    if (this.tableEl) {
      const newTable = this.buildTable(block.attrs?.rows ?? []);
      this.tableEl.replaceWith(newTable);
      this.tableEl = newTable;
    }
    if (wasActive) this.refocusCell(savedRow, savedCol);
  }

  private refocusCell(rowIdx: number, colIdx: number): void {
    const rows = Array.from(this.tableEl.querySelectorAll('tr'));
    const tr   = rows[Math.min(rowIdx, rows.length - 1)];
    if (!tr) return;
    const cells = Array.from(tr.querySelectorAll<HTMLElement>('[contenteditable]'));
    const cell  = cells[Math.min(colIdx, cells.length - 1)];
    cell?.focus();
  }

  override destroy(): void {
    this.rowHandle?.remove();
    this.colHandle?.remove();
    super.destroy();
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: { ...this.block.attrs, rows: this.tableEl ? this.currentRows() : this.block.attrs?.rows ?? [] },
    };
  }

  focusBlock(): void {
    const first = this.tableEl.querySelector<HTMLElement>('[contenteditable]');
    first?.focus();
  }
}

if (!customElements.get('pila-table')) {
  customElements.define('pila-table', TableBlock);
}
