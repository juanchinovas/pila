import { icon, Icons, LucideIconNode } from './icons';

export interface TableToolbarContext {
  headerRow: boolean
  headerCol: boolean
  onToggleHeaderRow(): void
  onToggleHeaderCol(): void
  onAlign(align: 'left' | 'center' | 'right'): void
  onAddRowAbove(): void
  onAddRowBelow(): void
  onAddColLeft(): void
  onAddColRight(): void
  onDeleteRow(): void
  onDeleteCol(): void
}

// Namespaced classes used for toolbar buttons are defined in pila.css

export class TableToolbar {
  private portalTo: HTMLElement;
  private el: HTMLElement;
  private headerRowBtn!: HTMLButtonElement;
  private headerColBtn!: HTMLButtonElement;
  private ctx: TableToolbarContext | null = null;
  private attached = false;

  constructor(portalTo: HTMLElement = document.body) {
    this.portalTo = portalTo;
    this.el = this.buildDOM();
    this.el.style.display = 'none';
    this.ensureAttached();
  }

  private buildDOM(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'pila-table-toolbar';
    toolbar.dataset.pilaUi = 'table-toolbar';

    // Toggle header row / col
    this.headerRowBtn = this.makeIconBtn(Icons.Rows2,   () => this.ctx?.onToggleHeaderRow(), 'Toggle header row', 'Row');
    this.headerColBtn = this.makeIconBtn(Icons.Columns2, () => this.ctx?.onToggleHeaderCol(), 'Toggle header column', 'Col');
    toolbar.appendChild(this.headerRowBtn);
    toolbar.appendChild(this.headerColBtn);

    toolbar.appendChild(this.sep());

    // Alignment
    const alignments: { iconNode: LucideIconNode; align: 'left' | 'center' | 'right'; title: string }[] = [
      { iconNode: Icons.AlignLeft,   align: 'left',   title: 'Align left'   },
      { iconNode: Icons.AlignCenter, align: 'center', title: 'Align center' },
      { iconNode: Icons.AlignRight,  align: 'right',  title: 'Align right'  },
    ];
    alignments.forEach(({ iconNode, align, title }) => {
      toolbar.appendChild(this.makeIconBtn(iconNode, () => this.ctx?.onAlign(align), title));
    });

    toolbar.appendChild(this.sep());

    // Row operations
    toolbar.appendChild(this.makeIconBtn(Icons.ArrowUpToLine,   () => this.ctx?.onAddRowAbove(), 'Add row above', 'Row'));
    toolbar.appendChild(this.makeIconBtn(Icons.ArrowDownToLine, () => this.ctx?.onAddRowBelow(), 'Add row below', 'Row'));

    toolbar.appendChild(this.sep());

    // Column operations
    toolbar.appendChild(this.makeIconBtn(Icons.ArrowLeftToLine,  () => this.ctx?.onAddColLeft(),  'Add column left', 'Col'));
    toolbar.appendChild(this.makeIconBtn(Icons.ArrowRightToLine, () => this.ctx?.onAddColRight(), 'Add column right', 'Col'));

    toolbar.appendChild(this.sep());

    // Delete (red on hover)
    const delRow = this.makeIconBtn(Icons.Trash2, () => this.ctx?.onDeleteRow(), 'Delete row', 'Row');
    delRow.classList.add('pila-table-delete-btn');
    toolbar.appendChild(delRow);

    const delCol = this.makeIconBtn(Icons.Trash2, () => this.ctx?.onDeleteCol(), 'Delete column', 'Col');
    delCol.classList.add('pila-table-delete-btn');
    toolbar.appendChild(delCol);

    return toolbar;
  }

  private sep(): HTMLElement {
    const s = document.createElement('span');
    s.className = 'pila-table-toolbar-sep';
    return s;
  }

  private makeIconBtn(iconNode: LucideIconNode, handler: () => void, title?: string, text?: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pila-table-toolbar-btn';
    if (title) btn.title = title;
    btn.appendChild(icon(iconNode, 14));
    if (text) btn.appendChild(document.createTextNode(text));
    btn.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault(); // keep cell focused
      handler();
    });
    return btn;
  }

  /** Show the toolbar anchored above (or below if near top) `anchor`. */
  show(anchor: HTMLElement, ctx: TableToolbarContext): void {
    this.ensureAttached();
    this.ctx = ctx;
    this.setActive(this.headerRowBtn, ctx.headerRow);
    this.setActive(this.headerColBtn, ctx.headerCol);
    this.el.style.display = 'flex';
    // Defer positioning by one frame so the browser has laid out the element
    // and getBoundingClientRect() returns accurate dimensions.
    requestAnimationFrame(() => this.position(anchor));
  }

  hide(): void {
    this.ctx = null;
    this.el.style.display = 'none';
  }

  private position(anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const elRect = this.el.getBoundingClientRect();
    let top = rect.top - elRect.height - 6;
    if (top < 4) top = rect.bottom + 6;
    const left = Math.max(4, Math.min(rect.left, window.innerWidth - elRect.width - 4));
    this.el.style.top  = `${top}px`;
    this.el.style.left = `${left}px`;
  }

  private setActive(btn: HTMLButtonElement, active: boolean): void {
    btn.style.backgroundColor = active ? 'var(--pila-accent)' : '';
    btn.style.color            = active ? '#fff'               : '';
    btn.style.borderColor      = active ? 'var(--pila-accent)' : '';
  }

  destroy(): void {
    this.hide();
    this.el.remove();
    this.attached = false;
  }

  private ensureAttached(): void {
    if (this.attached && this.el.isConnected) return;
    if (!this.el.isConnected) {
      this.portalTo.appendChild(this.el);
    }
    this.attached = true;
  }
}
