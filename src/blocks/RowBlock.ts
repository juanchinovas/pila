import { Block, BlockAttrs } from '../types';
import { PilaBlock } from './PilaBlock';
import { ColumnEditor } from '../core/ColumnEditor';
import { generateId } from '../core/utils';
import { BlockAction } from '@/ui/BlockPopover';

const BORDER_STYLES: { label: string; value: BlockAttrs['borderStyle'] }[] = [
  { label: 'None', value: 'none' },
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
];

const BORDER_WIDTHS: { label: string; value: string }[] = [
  { label: '1px', value: '1px' },
  { label: '2px', value: '2px' },
  { label: '3px', value: '3px' },
  { label: '4px', value: '4px' },
  { label: '6px', value: '6px' },
  { label: '8px', value: '8px' },
];

const BORDER_RADII: { label: string; value: string }[] = [
  { label: 'None', value: '0px' },
  { label: '4px', value: '4px' },
  { label: '6px', value: '6px' },
  { label: '8px', value: '8px' },
  { label: '12px', value: '12px' },
  { label: '16px', value: '16px' },
  { label: '24px', value: '24px' },
  { label: 'Full (50%)', value: '50%' },
];

const BORDER_SIDES: { label: string; side: 'top' | 'bottom' | 'left' | 'right' }[] = [
  { label: 'Top', side: 'top' },
  { label: 'Bottom', side: 'bottom' },
  { label: 'Left', side: 'left' },
  { label: 'Right', side: 'right' },
];

export class RowBlock extends PilaBlock {
  private editor!: ColumnEditor;

  get colorOptions(): boolean {
    return true;
  }

  getPopoverActions(): BlockAction[] {
    const attrs = this.block.attrs ?? {};
    const currentStyle = attrs.borderStyle ?? 'none';
    const currentWidth = attrs.borderWidth ?? '1px';
    const currentColor = attrs.borderColor ?? 'var(--pila-border)';
    const currentRadius = attrs.borderRadius ?? '0px';

    const actions: BlockAction[] = [
      {
        label: `Border Style: ${currentStyle}`,
        icon: 'Minus',
        type: 'action',
        children: BORDER_STYLES.map(({ label, value }) => ({
          label,
          value,
          type: 'action',
          icon: value === currentStyle ? 'Check' : 'Minus',
          handler: () => this.setBorderAttr('borderStyle', value),
        })),
      },
      {
        label: 'Border Sides',
        icon: 'Minus',
        type: 'action',
        children: BORDER_SIDES.map(({ label, side }) => {
          const key = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof BlockAttrs;
          const active = (attrs[key] as boolean) === true;

          return {
            label: `${label}: ${active ? 'On' : 'Off'}`,
            icon: 'Minus',
            type: 'action',
            value: side,
            handler: (ev: CustomEvent<BlockAction>) => {
              const _side = ev.detail.value as 'top' | 'bottom' | 'left' | 'right';
              const key = `border${_side.charAt(0).toUpperCase() + _side.slice(1)}` as keyof BlockAttrs;
              const active = (attrs[key] as boolean) === true;
              
              this.setBorderAttr(key, !active);
            },
          };
        }),
      },
      {
        label: `Border Width: ${currentWidth}`,
        icon: 'Minus',
        type: 'action',
        value: currentWidth,
        children: BORDER_WIDTHS.map(({ label, value }) => ({
          label,
          type: 'action',
          value,
          icon: value === currentWidth ? 'Check' : 'Minus',
          handler: (ev: CustomEvent<BlockAction>) => this.setBorderAttr('borderWidth', ev.detail.value),
        })),
      },
      {
        label: 'Border Color',
        icon: 'Paintbucket',
        color: currentColor,
        type: 'color',
        value: currentColor,
        handler: (ev: CustomEvent<BlockAction>) => {
          this.setBorderAttr('borderColor', String(ev.detail.value));
        },
      },
      {
        label: `Border Radius: ${currentRadius}`,
        icon: 'Minus',
        type: 'action',
        value: currentRadius,
        children: BORDER_RADII.map(({ label, value }) => ({
          label,
          type: 'action',
          value,
          icon: value === currentRadius ? 'Check' : 'Minus',
          handler: (ev: CustomEvent<BlockAction>) => this.setBorderAttr('borderRadius', ev.detail.value),
        })),
      },
      ...super.getPopoverActions(),
    ];

    return actions;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  protected buildDOM() {
    this.classList.add('pila-row-block', '!my-5');

    this.applyStyles();

    const blocks = this.rowBlocks();
    this.renderInner(blocks);
  }

  override updateData(block: Block): void {
    const wasActive = this.contains(document.activeElement);
    super.updateData(block);
    this.applyStyles();
    if (wasActive) {
      this.editor?.focusFirst();
    }
  }

  override destroy(): void {
    this.destroyEditor();
    super.destroy();
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: {
        ...this.block.attrs,
        rowBlocks: this.editor ? this.editor.getBlocks() : this.block.attrs?.rowBlocks ?? [],
      },
    };
  }

  focusBlock(): void {
    this.editor?.focusFirst();
  }

  private rowBlocks(): Block[] {
    const blocks = this.block.attrs?.rowBlocks;

    return blocks && blocks.length > 0
      ? blocks
      : [{ id: generateId(), type: 'paragraph', content: [] }];
  }

  private renderInner(blocks: Block[]): void {
    const def = { blocks };

    if (this.editor) {
      this.removeChild(this.editor.el);
      this.editor.destroy();
      this.editor = undefined!;
    }
    
    this.editor = new ColumnEditor(def, this.ctx);

    this.appendChild(this.editor.el);

    this.applyStyles();
  }

  // ── Data helpers ───────────────────────────────────────────────────────────

  private setBorderAttr(key: keyof BlockAttrs, value: unknown): void {
    this.ctx.manager.update(this.block.id!, {
      attrs: { ...this.block.attrs, [key]: value },
    });
  }

  // ── Border & background styles ────────────────────────────────────────────
  private applyStyles(): void {
    if (!this.editor) return;
    const attrs = this.block.attrs ?? {};

    // Background color
    if (attrs.background) {
      this.style.backgroundColor = attrs.background;
    } else {
      this.style.backgroundColor = '';
    }

    // Text color
    if (attrs.textColor) {
      this.style.color = attrs.textColor;
    } else {
      this.style.color = '';
    }

    // Border styles
    const style = attrs.borderStyle ?? 'none';
    const width = attrs.borderWidth ?? '1px';
    const color = attrs.borderColor ?? 'var(--pila-border)';
    const radius = attrs.borderRadius ?? '0px';

    const top = attrs.borderTop !== false ? `${width} ${style} ${color}` : 'none';
    const bottom = attrs.borderBottom !== false ? `${width} ${style} ${color}` : 'none';
    const left = attrs.borderLeft !== false ? `${width} ${style} ${color}` : 'none';
    const right = attrs.borderRight !== false ? `${width} ${style} ${color}` : 'none';

    this.style.borderTop = top;
    this.style.borderBottom = bottom;
    this.style.borderLeft = left;
    this.style.borderRight = right;
    this.style.borderRadius = radius;
    this.style.padding = style !== 'none' ? '8px' : '0';
  }

  private destroyEditor(): void {
    this.eventGroup.unsubscribeAll();
    this.editor?.destroy();
  }
}

if (!customElements.get('pila-row')) {
  customElements.define('pila-row', RowBlock);
}
