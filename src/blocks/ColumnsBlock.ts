import { Block, ColumnDef } from '../types';
import { PilaBlock } from './PilaBlock';
import { ColumnEditor } from '../core/ColumnEditor';
import { BlockPopover, BlockAction } from '../ui/BlockPopover';
import { icon, Icons } from '../ui/icons';
import { setPortalPosition } from '../ui/overlayPosition';
import { generateId } from '../core/utils';

const WIDTH_PRESETS: { label: string; flex: number }[] = [
  { label: 'Half width', flex: 0.5 },
  { label: 'Equal width', flex: 1 },
  { label: 'Double width', flex: 2 },
  { label: 'Triple width', flex: 3 },
];

export class ColumnsBlock extends PilaBlock {
  private containerEl!: HTMLDivElement;
  private columnEditors: ColumnEditor[] = [];
  private focusedColIndex = 0;
  private prevDefsHash = '';

  // Settings button (like Table's cellSettingsBtn)
  private colSettingsBtn: HTMLDivElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  get colorOptions(): boolean {
    return false;
  }

  getPopoverActions(): BlockAction[] {
    const actions: BlockAction[] = [
      ...super.getPopoverActions(),
    ];

    return actions;
  }

  // |── Lifecycle ─────────────────────────────────────────────────────────────|

  protected buildDOM(): void {
    this.classList.add('pila-columns-block', '!my-5');

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'pila-columns';

    const defs = this.columnDefs();
    this.prevDefsHash = JSON.stringify(defs);
    this.renderColumns(defs);
    this.appendChild(this.containerEl);

    this.eventGroup.on(this, 'mouseleave', () => this.scheduleHide());
  }

  override updateData(block: Block): void {
    const wasActive  = this.contains(document.activeElement);
    const savedIndex = this.focusedColIndex;
    super.updateData(block);
    if (this.containerEl) {
      const newDefs = this.columnDefs();
      const hash = JSON.stringify(newDefs);
      if (hash !== this.prevDefsHash) {
        this.prevDefsHash = hash;
        this.destroyColumnEditors();
        this.renderColumns(newDefs);
      }
      if (wasActive) {
        this.columnEditors[Math.min(savedIndex, this.columnEditors.length - 1)]?.focusFirst();
      }
    }
  }

  override destroy(): void {
    this.colSettingsBtn?.remove();
    this.clearHideTimeout();
    this.destroyColumnEditors();
    super.destroy();
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: { ...this.block.attrs, columnDefs: this.containerEl ? this.readDefs() : this.block.attrs?.columnDefs ?? [] },
    };
  }

  focusBlock(): void {
    this.columnEditors[0]?.focusFirst();
  }

  // ── Settings button visibility ────────────────────────────────────────────

  private scheduleHide(): void {
    this.clearHideTimeout();
    this.hideTimeout = setTimeout(() => this.hideSettingsBtn(), 100);
  }

  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private hideSettingsBtn(): void {
    if (this.colSettingsBtn) this.colSettingsBtn.style.display = 'none';
  }

  private showColSettings(colIdx: number, colEl: HTMLElement): void {
    if (!this.colSettingsBtn) {
      this.colSettingsBtn = document.createElement('div');
      this.colSettingsBtn.className = 'pila-table-handle w-5 h-5 !p-0';
      this.colSettingsBtn.style.position = 'absolute';
      this.colSettingsBtn.style.zIndex = '9001';
      this.colSettingsBtn.appendChild(icon(Icons.Settings2, 12));
      this.eventGroup.on(this.colSettingsBtn, 'click', (e) => {
        e.stopPropagation();
        this.openColPopover(e.clientX, e.clientY);
      });
      this.eventGroup.on(this.colSettingsBtn, 'mouseenter', () => this.clearHideTimeout());
      this.eventGroup.on(this.colSettingsBtn, 'mouseleave', () => this.scheduleHide());
      this.ctx.portalTo?.appendChild(this.colSettingsBtn);
    }

    const rect = colEl.getBoundingClientRect();
    this.colSettingsBtn.style.display = 'flex';
    setPortalPosition(this.colSettingsBtn, this.ctx.portalTo ?? document.body, rect.right - 22, rect.top + 2);

    this.focusedColIndex = colIdx;
    this.clearHideTimeout();
  }

  // ── Column settings popover ───────────────────────────────────────────────

  private openColPopover(x: number, y: number): void {
    const popover = new BlockPopover(this.ctx.portalTo);
    const defs = this.readDefs();
    const currentFlex = defs[this.focusedColIndex]?.width ?? 1;

    popover.open(x, y, [
      { label: 'Add column left', type: 'action', value: 'left', icon: 'ArrowLeftToLine', handler: (ev: CustomEvent<BlockAction>) => this.addColumn(ev.detail.value as 'left') },
      { label: 'Add column right', type: 'action', value: 'right', icon: 'ArrowRightToLine', handler: (ev: CustomEvent<BlockAction>) => this.addColumn(ev.detail.value as 'right') },
      {
        label: `Width: ${currentFlex}x`,
        icon: 'Columns2',
        type: 'action',
        children: WIDTH_PRESETS.map(({ label, flex }) => ({
          label,
          value: flex,
          type: 'action',
          icon: Math.abs(flex - currentFlex) < 0.01 ? 'Check' : 'Columns2',
          handler: (ev: CustomEvent<BlockAction>) => this.setColumnWidth(ev.detail.value as number),
        })),
      },
      { label: 'Background', type: 'color', value: '', icon: 'Paintbucket', handler: (e: CustomEvent<BlockAction>) => this.setColStyle({ background: String(e.detail.value) }) },
      { label: 'Text color', type: 'color', value: '', icon: 'Palette', handler: (e: CustomEvent<BlockAction>) => this.setColStyle({ color: String(e.detail.value) }) },
      { label: 'Clear styling', type: 'action', icon: 'Eraser', handler: () => this.setColStyle({ background: '', color: '' }) },
      { label: 'Delete column', type: 'action', icon: 'Trash2', danger: true, handler: () => this.deleteColumn() },
    ]);
  }

  /*private showColorPicker(e: MouseEvent, type: 'background' | 'color'): void {
    e.stopPropagation();

    const defs = this.readDefs();
    const currentColor = (defs[this.focusedColIndex]?.[type] as string) || '#ffffff';

    const input = document.createElement('input');
    input.type = 'color';
    input.setAttribute('form', '');
    input.value = currentColor.startsWith('#') ? currentColor : '#ffffff';
    input.style.position = 'absolute';
    input.style.opacity = '0';
    setPortalPosition(input, this.ctx.portalTo ?? document.body, e.clientX, e.clientY);
    this.ctx.portalTo?.appendChild(input);

    input.addEventListener('input', debounce(() => {
      this.setColStyle({ [type]: input.value });
    }, 100));

    input.addEventListener('change', () => {
      input.remove();
    });

    input.click();
  }*/

  private setColStyle(style: { background?: string; color?: string }): void {
    const defs = this.readDefs();
    const col = defs[this.focusedColIndex];
    if (!col) return;
    if (style.background !== undefined) col.background = style.background;
    if (style.color !== undefined) col.color = style.color;
    this.saveDefs(defs);
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private columnDefs(): ColumnDef[] {
    const defs = this.block.attrs?.columnDefs;
    return defs && defs.length > 0
      ? defs
      : [{ blocks: [] }, { blocks: [] }];
  }

  private renderColumns(defs: ColumnDef[]): void {
    this.containerEl.innerHTML = '';
    this.columnEditors = [];
    defs.forEach((def, idx) => {
      if (idx > 0) {
        this.containerEl.appendChild(this.buildResizeHandle(idx - 1));
      }
      this.containerEl.appendChild(this.buildColumn(def, idx));
    });

    if (this.columnEditors.length > 0) {
      this.columnEditors[0].onEscapeUp = () => this.focusOuterBlock('prev');
      this.columnEditors[this.columnEditors.length - 1].onEscapeDown = () => this.focusOuterBlock('next');
    }
  }

  private buildColumn(def: ColumnDef, idx: number): HTMLDivElement {
    const col = document.createElement('div');
    col.className        = 'pila-column';
    col.dataset.colIndex = String(idx);
    col.dataset.flexGrow = String(def.width ?? 1);
    col.style.flex       = `${def.width ?? 1} 1 0%`;

    if (def.background) col.style.backgroundColor = def.background;
    if (def.color) col.style.color = def.color;

    const editor = new ColumnEditor(def, this.ctx);
    this.columnEditors[idx] = editor;

    this.eventGroup.on(editor.el, 'focusin', () => {
      this.focusedColIndex = idx;
    });

    this.eventGroup.on(col, 'mouseenter', () => {
      this.showColSettings(idx, col);
    });

    col.appendChild(editor.el);
    return col;
  }

  /** Drag handle between two adjacent columns. */
  private buildResizeHandle(leftIdx: number): HTMLDivElement {
    const handle = document.createElement('div');
    handle.className   = 'pila-column-resize-handle';
    handle.title       = 'Drag to resize columns';

    this.eventGroup.on(handle, 'mousedown', (e: MouseEvent) => {
      e.preventDefault();

      const cols       = this.columnEls();
      const colLeft    = cols[leftIdx];
      const colRight   = cols[leftIdx + 1];
      if (!colLeft || !colRight) return;

      const startX        = e.clientX;
      const startFlexL    = parseFloat(colLeft.dataset.flexGrow  ?? '1');
      const startFlexR    = parseFloat(colRight.dataset.flexGrow ?? '1');
      const totalFlex     = startFlexL + startFlexR;
      const containerW    = this.containerEl.offsetWidth;
      const startWidthL   = colLeft.offsetWidth;

      const onMove = (me: MouseEvent) => {
        const dx          = me.clientX - startX;
        const newWidthL   = startWidthL + dx;
        const totalW      = colLeft.offsetWidth + colRight.offsetWidth || containerW;
        const ratio       = Math.max(0.15, Math.min(0.85, newWidthL / totalW));
        const newFlexL    = round2(totalFlex * ratio);
        const newFlexR    = round2(totalFlex * (1 - ratio));

        colLeft.dataset.flexGrow  = String(newFlexL);
        colRight.dataset.flexGrow = String(newFlexR);
        colLeft.style.flex        = `${newFlexL} 1 0%`;
        colRight.style.flex       = `${newFlexR} 1 0%`;
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        this.persistDefs();
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });

    return handle;
  }

  // ── Outer-editor focus helpers ───────────────────────────────────────────────

  private focusOuterBlock(direction: 'prev' | 'next'): void {
    const allBlocks = this.ctx.manager.getAll();
    const idx       = allBlocks.findIndex((b) => b.id! === this.block.id!);

    if (direction === 'prev' && idx > 0) {
      requestAnimationFrame(() => {
      const targetId = allBlocks[idx - 1].id!;
      const targetEl = this.ctx.editorEl.querySelector<HTMLElement>(
        `[data-block-id="${targetId}"] [contenteditable], [data-block-id="${targetId}"] [tabindex]`
      );
      targetEl?.focus();
      });
    } else if (direction === 'next') {
      if (idx < allBlocks.length - 1) {
        requestAnimationFrame(() => {
        const targetId = allBlocks[idx + 1].id!;
        const targetEl = this.ctx.editorEl.querySelector<HTMLElement>(
          `[data-block-id="${targetId}"] [contenteditable], [data-block-id="${targetId}"] [tabindex]`
        );
        targetEl?.focus();
        });
      } else {
        console.log('Adding new block after columns block', this.block.id);
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id! });
        requestAnimationFrame(() => {
          const newEl = this.ctx.editorEl.querySelector<HTMLElement>(
            `[data-block-id="${newBlock.id!}"] [contenteditable]`
          );
          newEl?.focus();
        });
      }
    }
  }

  // ── Column operations ──────────────────────────────────────────────────────

  private addColumn(position: 'left' | 'right'): void {
    const defs     = this.readDefs();
    const insertAt = position === 'left' ? this.focusedColIndex : this.focusedColIndex + 1;
    defs.splice(insertAt, 0, {
      width: 1,
      blocks: [{ id: generateId(), type: 'paragraph', content: [] }],
    });
    this.focusedColIndex = insertAt;
    this.saveDefs(defs);
  }

  private deleteColumn(): void {
    const defs = this.readDefs();
    if (defs.length <= 1) return;
    defs.splice(this.focusedColIndex, 1);
    this.focusedColIndex = Math.max(0, this.focusedColIndex - 1);
    this.saveDefs(defs);
  }

  private setColumnWidth(flex: number): void {
    const defs = this.readDefs();
    if (!defs[this.focusedColIndex]) return;
    defs[this.focusedColIndex] = { ...defs[this.focusedColIndex], width: flex };
    this.saveDefs(defs);
  }

  // ── Data helpers ───────────────────────────────────────────────────────────

  private readDefs(): ColumnDef[] {
    return this.columnEls().map((col, idx) => ({
      width:      round2(parseFloat(col.dataset.flexGrow ?? '1') || 1),
      blocks:     this.columnEditors[idx]?.getBlocks() ?? [],
      background: col.style.backgroundColor || undefined,
      color:      col.style.color || undefined,
    }));
  }

  private persistDefs(): void {
    this.ctx.manager.update(this.block.id!, {
      attrs: { ...this.block.attrs, columnDefs: this.readDefs() },
    });
  }

  private saveDefs(defs: ColumnDef[]): void {
    this.ctx.manager.update(this.block.id!, {
      attrs: { ...this.block.attrs, columnDefs: defs },
    });
  }

  // DOM helpers

  private columnEls(): HTMLDivElement[] {
    return Array.from(this.containerEl.querySelectorAll<HTMLDivElement>(':scope > .pila-column'));
  }

  private destroyColumnEditors(): void {
    this.columnEditors.forEach((ed) => ed.destroy());
    this.columnEditors = [];
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

if (!customElements.get('pila-columns')) {
  customElements.define('pila-columns', ColumnsBlock);
}
