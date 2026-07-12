import { Block } from '../types';
import { PilaBlock } from './PilaBlock';
import { ImagePropsPopover } from '../ui/ImagePropsPopover';

export class ImageBlock extends PilaBlock {
  private img!: HTMLImageElement;
  private caption!: HTMLElement;
  private figure!: HTMLElement;
  private overlay!: HTMLDivElement;
  private propsPopover: ImagePropsPopover | null = null;

  protected buildDOM(): void {
    // ── Figure wrapper ────────────────────────────────────────────────────
    // position:relative on the wrapper lets the overlay be positioned inside
    this.classList.add('!my-5');
    this.figure = document.createElement('figure');
    this.figure.className = 'relative inline-block max-w-full mt-5';
    // display:table enables margin:auto centering
    this.figure.style.cssText = 'display: table; margin: 4px 0; margin-right: auto;';

    // ── Image ─────────────────────────────────────────────────────────────
    this.img = document.createElement('img');
    this.img.src = this.block.attrs?.src ?? '';
    this.img.alt = this.block.attrs?.alt ?? '';
    this.img.className = 'block max-w-full rounded-[var(--pila-radius)] outline-none transition-all';
    this.img.setAttribute('tabindex', '0');
    this.applyImageStyles();

    this.img.addEventListener('focus', () => {
      this.img.style.outline = '2px solid var(--pila-accent)';
      this.img.style.outlineOffset = '2px';
    });
    this.img.addEventListener('blur', () => {
      this.img.style.outline = '';
      this.img.style.outlineOffset = '';
    });

    this.img.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleArrow(e);
      if (e.key === 'Enter') {
        e.preventDefault();
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id! });
        requestAnimationFrame(() => {
          const el = this.ctx.editorEl.querySelector(
            `[data-block-id="${newBlock.id!}"] [contenteditable]`
          ) as HTMLElement | null;
          el?.focus();
        });
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.ctx.manager.delete(this.block.id!);
      }
    });

    // ── Caption ───────────────────────────────────────────────────────────
    this.caption = document.createElement('figcaption');
    this.caption.setAttribute('contenteditable', 'true');
    // keep pila-image-caption for :empty::before CSS
    this.caption.className =
      'pila-image-caption mt-[6px] text-[0.85rem] text-[color:var(--pila-muted)] ' +
      'text-center outline-none whitespace-pre-wrap';
    this.caption.textContent = this.block.attrs?.alt ?? '';
    this.caption.addEventListener('input', () => {
      this.img.alt = this.caption.textContent ?? '';
    });

    // ── Hover overlay with Edit button ────────────────────────────────────
    this.overlay = document.createElement('div');
    this.overlay.className =
      'absolute top-1.5 right-1.5 opacity-0 transition-opacity pointer-events-none';
    this.overlay.setAttribute('aria-hidden', 'true');

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.title = 'Edit image properties';
    editBtn.className =
      'flex items-center gap-1 px-2 py-1 text-xs rounded shadow ' +
      'bg-[var(--pila-bg)] border border-[var(--pila-border)] ' +
      'text-[var(--pila-text)] cursor-pointer transition-colors ' +
      'hover:bg-[var(--pila-accent)] hover:text-white hover:border-[var(--pila-accent)]';
    editBtn.innerHTML = '&#9881; Edit';
    editBtn.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPropsPopover(e.clientX, e.clientY);
    });
    this.overlay.appendChild(editBtn);

    // Show overlay on figure hover
    const showOverlay = () => {
      this.overlay.classList.remove('opacity-0', 'pointer-events-none');
      this.overlay.classList.add('opacity-100', 'pointer-events-auto');
    };
    const hideOverlay = () => {
      this.overlay.classList.add('opacity-0', 'pointer-events-none');
      this.overlay.classList.remove('opacity-100', 'pointer-events-auto');
    };
    this.figure.addEventListener('mouseenter', showOverlay);
    this.figure.addEventListener('mouseleave', hideOverlay);

    // ── Resizer ───────────────────────────────────────────────────────────
    const resizer = document.createElement('div');
    resizer.className = 'absolute bottom-8 right-0 w-1 top-8 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity z-10';
    resizer.style.cssText = 'background: var(--pila-accent); border-radius: 2px; margin: 2px;';
    
    // Add a group class to figure for the hover effect
    this.figure.classList.add('group');

    let isResizing = false;
    let startX: number, startWidth: number;

    resizer.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startWidth = this.img.clientWidth;

      const onMouseMove = (me: MouseEvent) => {
        if (!isResizing) return;
        const dx = me.clientX - startX;
        const newWidth = Math.max(20, startWidth + dx);
        this.img.style.width = `${newWidth}px`;
        this.img.style.height = 'auto'; 
      };

      const onMouseUp = () => {
        if (isResizing) {
          isResizing = false;
          this.ctx.manager.update(this.block.id!, {
            attrs: {
              ...(this.block.attrs ?? {}),
              width: `${this.img.clientWidth}px`,
              height: 'auto'
            }
          });
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup',   onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup',   onMouseUp);
    });

    // ── Wrapper for Image and Resizer ─────────────────────────────────────
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'relative inline-block leading-[0]';
    imgWrapper.appendChild(this.img);
    imgWrapper.appendChild(resizer);

    // ── Assemble ──────────────────────────────────────────────────────────
    this.figure.appendChild(imgWrapper);
    this.figure.appendChild(this.overlay);
    this.figure.appendChild(this.caption);
    this.appendChild(this.figure);
  }

  private async openPropsPopover(x: number, y: number): Promise<void> {
    if (!this.propsPopover) {
      this.propsPopover = new ImagePropsPopover(this.ctx.portalTo);
    }
    const result = await this.propsPopover.open(x, y, this.block.attrs ?? {});

    if (result === null) return;

    const newAttrs = {
      ...(this.block.attrs ?? {}),
      src:             result.src || this.block.attrs?.src,
      width:           result.width  || undefined,
      height:          result.height || undefined,
      alt:             result.alt,
      objectFit:       result.objectFit,
      borderRadius:    result.borderRadius,
    };

    this.caption.textContent = result.alt;
    this.img.alt = result.alt;
    this.ctx.manager.update(this.block.id!, { attrs: newAttrs });
    this.applyImageStyles();
  }

  private applyImageStyles(): void {
    const { width, height, objectFit, borderRadius, src } = this.block.attrs ?? {};
    this.img.style.width  = width  ?? '';
    this.img.src = src ?? this.img.src;
    this.img.style.height = height ?? '';
    this.img.style.objectFit = objectFit ?? '';
    this.img.style.borderRadius = borderRadius ?? '';

    this.applyFigureAlignment(this.block.attrs?.alignment as 'left' | 'center' | 'right' | undefined);
  }

  private applyFigureAlignment(value: 'left' | 'center' | 'right' | undefined): void {
    if (!this.figure) return;
    if (!value || value === 'left') {
      this.figure.style.marginLeft = '';
      this.figure.style.marginRight = 'auto';
    } else if (value === 'center') {
      this.figure.style.marginLeft = 'auto';
      this.figure.style.marginRight = 'auto';
    } else if (value === 'right') {
      this.figure.style.marginLeft = 'auto';
      this.figure.style.marginRight = '';
    }
  }

  override destroy(): void {
    super.destroy();
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: {
        ...this.block.attrs,
        alt: this.caption?.textContent ?? this.block.attrs?.alt ?? '',
      },
    };
  }

  focusBlock(): void {
    this.img.focus();
  }
}

if (!customElements.get('pila-image')) {
  customElements.define('pila-image', ImageBlock);
}
