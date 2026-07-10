import { icon, Icons, LucideIconNode } from './icons';
import { portalViewportBounds, setPortalPosition } from './overlayPosition';

export interface ColumnsToolbarContext {
  columnCount: number
  focusedIndex: number
  onAddColLeft(): void
  onAddColRight(): void
  onDeleteCol(): void
  onDeleteBlock(): void
  onSetWidth(flex: number): void
  getCurrentWidth(): number
}

const BTN =
  'px-1.5 py-0.5 rounded border border-transparent ' +
  'bg-transparent text-[color:var(--pila-text)] cursor-pointer ' +
  'transition-colors hover:bg-[var(--pila-accent)] hover:text-white select-none ' +
  'flex items-center justify-center flex-col gap-0';

const SEP_CLS = 'w-px h-4 bg-[var(--pila-border)] mx-0.5 shrink-0 self-center';

const WIDTH_PRESETS: { label: string; flex: number; title: string }[] = [
  { label: '½×', flex: 0.5, title: 'Half width'   },
  { label: '1×', flex: 1,   title: 'Equal width'  },
  { label: '2×', flex: 2,   title: 'Double width' },
  { label: '3×', flex: 3,   title: 'Triple width' },
];

export class ColumnsToolbar {
  private portalTo: HTMLElement;
  private el: HTMLElement;
  private ctx: ColumnsToolbarContext | null = null;
  private deleteColBtn!: HTMLButtonElement;
  private widthBtns: Array<{ btn: HTMLButtonElement; flex: number }> = [];

  constructor(portalTo: HTMLElement = document.body) {
    this.portalTo = portalTo;
    this.el = this.buildDOM();
    this.el.style.display = 'none';
    this.portalTo.appendChild(this.el);
  }

  private buildDOM(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className =
      'absolute z-[9000] flex items-center gap-px px-1 py-1 rounded-lg shadow-xl ' +
      'bg-[var(--pila-bg)] border border-[var(--pila-border)]';

    // Add column left / right
    toolbar.appendChild(
      this.makeIconBtn(Icons.ArrowLeftToLine, () => this.ctx?.onAddColLeft(), 'Add column to the left', 'Col'),
    );
    toolbar.appendChild(
      this.makeIconBtn(Icons.ArrowRightToLine, () => this.ctx?.onAddColRight(), 'Add column to the right', 'Col'),
    );

    toolbar.appendChild(this.sep());

    // Width presets — flex-grow factor for the focused column
    WIDTH_PRESETS.forEach(({ label, flex, title }) => {
      const btn = this.makeTextBtn(label, () => this.ctx?.onSetWidth(flex), title);
      this.widthBtns.push({ btn, flex });
      toolbar.appendChild(btn);
    });

    toolbar.appendChild(this.sep());

    // Delete focused column (disabled when only one column remains)
    this.deleteColBtn = this.makeIconBtn(
      Icons.Trash2,
      () => this.ctx?.onDeleteCol(),
      'Delete column',
      'Col'
    );
    this.deleteColBtn.classList.add('hover:!bg-red-500');
    toolbar.appendChild(this.deleteColBtn);
/*
    toolbar.appendChild(this.sep())

    // Delete entire columns block
      const delBlock = this.makeIconBtn(
        Icons.Trash2,
        () => this.ctx?.onDeleteBlock(),
        'Delete columns block',
        'Block'
      )
      delBlock.classList.add('hover:!bg-red-600')
      toolbar.appendChild(delBlock)
    */
    return toolbar;
  }

  private sep(): HTMLElement {
    const s = document.createElement('span');
    s.className = SEP_CLS;
    return s;
  }

  private makeIconBtn(
    iconNode: LucideIconNode,
    handler: () => void,
    title?: string,
    text?: string,
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN;
    if (title) btn.title = title;
    btn.appendChild(icon(iconNode, 12));
    if (text) btn.appendChild(document.createTextNode(text));
    btn.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      handler();
    });
    return btn;
  }

  private makeTextBtn(
    label: string,
    handler: () => void,
    title?: string,
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN + ' text-xs font-mono min-w-[30px]';
    if (title) btn.title = title;
    btn.textContent = label;
    btn.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      handler();
    });
    return btn;
  }

  show(anchor: HTMLElement, ctx: ColumnsToolbarContext): void {
    this.ctx = ctx;

    // Disable delete-col when only one column remains
    this.deleteColBtn.disabled = ctx.columnCount <= 1;
    this.deleteColBtn.style.opacity = ctx.columnCount <= 1 ? '0.35' : '';

    // Highlight the width preset that matches the current column's flex-grow
    const currentFlex = ctx.getCurrentWidth();
    this.widthBtns.forEach(({ btn, flex }) => {
      const active = Math.abs(flex - currentFlex) < 0.01;
      btn.style.backgroundColor = active ? 'var(--pila-accent)' : '';
      btn.style.color            = active ? '#fff'               : '';
      btn.style.borderColor      = active ? 'var(--pila-accent)' : '';
    });

    this.el.style.display = 'flex';
    requestAnimationFrame(() => this.position(anchor));
  }

  hide(): void {
    this.ctx = null;
    this.el.style.display = 'none';
  }

  private position(anchor: HTMLElement): void {
    const rect   = anchor.getBoundingClientRect();
    const elRect = this.el.getBoundingClientRect();
    const bounds = portalViewportBounds(this.portalTo);

    let topViewport = rect.top - elRect.height - 6;
    if (topViewport < bounds.top + 4) topViewport = rect.bottom + 6;
    topViewport = Math.max(bounds.top + 4, topViewport);

    const leftViewport = Math.max(bounds.left + 4, Math.min(rect.left, bounds.right - elRect.width - 4));
    setPortalPosition(this.el, this.portalTo, leftViewport, topViewport);
  }

  destroy(): void {
    this.hide();
    this.el.remove();
  }
}
