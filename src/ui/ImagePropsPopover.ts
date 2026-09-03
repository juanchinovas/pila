import { BlockAttrs } from '../types';
import { setPortalPosition } from './overlayPosition';

export interface ImagePropsResult {
  src?: string
  width: string
  height: string
  alt: string
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  borderRadius?: string
  alignment?: 'left' | 'center' | 'right'
}

export class ImagePropsPopover {
  private portalTo: HTMLElement;
  private popoverEl: HTMLElement | null = null;
  private srcField!: HTMLInputElement;
  private widthField!: HTMLInputElement;
  private heightField!: HTMLInputElement;
  private altField!: HTMLInputElement;
  private objectFitField!: HTMLSelectElement;
  private alignmentField!: HTMLSelectElement;
  private borderRadiusField!: HTMLInputElement;
  
  private resolveFn: ((result: ImagePropsResult | null) => void) | null = null;

  private readonly FIELD_CLASS = 'pila-modal-field';

  private readonly LABEL_CLASS = 'pila-modal-label';

  constructor(portalTo: HTMLElement = document.body) {
    this.portalTo = portalTo;
  }

  async open(x: number, y: number, attrs: BlockAttrs): Promise<ImagePropsResult | null> {
    this.close();

    return new Promise((resolve) => {
      this.resolveFn = resolve;

      this.popoverEl = document.createElement('div');
      this.popoverEl.className = 'pila-image-props-popover';
      setPortalPosition(this.popoverEl, this.portalTo, x, y);

      // Fields
      const uploadContainer = document.createElement('div');
      uploadContainer.className = 'pila-image-upload-container';

      const separator = document.createElement('div');
      separator.className = 'pila-modal-separator';
      separator.innerHTML = '<span class="pila-modal-sep-text">or</span>';

      const uploadArea = this.makeFileInputField();
      uploadContainer.appendChild(uploadArea);
      uploadContainer.appendChild(separator);

      this.popoverEl.appendChild(uploadArea);

      this.popoverEl.appendChild(this.makeField('Source', 'text', attrs.src ?? '', (el) => {
        this.srcField = el as HTMLInputElement;
        el.addEventListener('input', (ev) => {
          uploadArea.querySelector('img')?.setAttribute('src', ev.target instanceof HTMLInputElement ? ev.target.value : '');
        });
      }));
      
      uploadArea.querySelector('img')?.setAttribute('src', attrs.src ?? '');
      
      const dims = document.createElement('div');
      dims.style.display = 'flex';
      dims.style.gap = '8px';
      dims.appendChild(this.makeField('Width', 'text', attrs.width ?? '', (el) => this.widthField = el as HTMLInputElement));
      dims.appendChild(this.makeField('Height', 'text', attrs.height ?? '', (el) => this.heightField = el as HTMLInputElement));
      this.popoverEl.appendChild(dims);

      this.popoverEl.appendChild(this.makeField('Alt Text', 'text', attrs.alt ?? '', (el) => this.altField = el as HTMLInputElement));
      
      // Object Fit
      const fitWrapper = document.createElement('div');
      const fitLabel = document.createElement('label');
      fitLabel.className = this.LABEL_CLASS;
      fitLabel.textContent = 'Object Fit';
      this.objectFitField = document.createElement('select');
      this.objectFitField.className = this.FIELD_CLASS
      ;['fill', 'contain', 'cover', 'none', 'scale-down'].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        if (attrs.objectFit === opt) o.selected = true;
        this.objectFitField.appendChild(o);
      });
      fitWrapper.appendChild(fitLabel);
      fitWrapper.appendChild(this.objectFitField);
      this.popoverEl.appendChild(fitWrapper);

      this.popoverEl.appendChild(this.makeField('Border Radius (px)', 'text', attrs.borderRadius ?? '', (el) => this.borderRadiusField = el as HTMLInputElement));

      // alimentment
      const alignmentWrapper = document.createElement('div');
      const alignmentLabel = document.createElement('label');
      alignmentLabel.className = this.LABEL_CLASS;
      alignmentLabel.textContent = 'Alignment';
      this.alignmentField = document.createElement('select');
      this.alignmentField.className = this.FIELD_CLASS;
      ['left', 'center', 'right'].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        if (attrs.alignment === opt) o.selected = true;
        this.alignmentField.appendChild(o);
      });
      alignmentWrapper.appendChild(alignmentLabel);
      alignmentWrapper.appendChild(this.alignmentField);
      this.popoverEl.appendChild(alignmentWrapper);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '8px';
      actions.style.marginTop = '4px';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'pila-btn pila-btn--cancel';
      cancelBtn.onclick = () => this.cancel();

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      saveBtn.className = 'pila-btn pila-btn--confirm';
      saveBtn.onclick = () => this.confirm();

      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);
      this.popoverEl.appendChild(actions);

      this.portalTo.appendChild(this.popoverEl);

      // Close on outside click
      const onMouseDown = (e: MouseEvent) => {
        if (this.popoverEl && !this.popoverEl.contains(e.target as Node)) {
          this.cancel();
          document.removeEventListener('mousedown', onMouseDown);
        }
      };
      document.addEventListener('mousedown', onMouseDown);
    });
  }

  private makeField(label: string, type: string, value: string, ref: (el: HTMLElement) => void): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.flex = '1';
    const lbl = document.createElement('label');
    lbl.className = this.LABEL_CLASS;
    lbl.textContent = label;
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.setAttribute('form', '');
    input.className = this.FIELD_CLASS;
    ref(input);
    wrapper.appendChild(lbl);
    wrapper.appendChild(input);
    return wrapper;
  }

  private makeFileInputField() {
  // Fields
    const uploadArea = document.createElement('div');
    uploadArea.className = 'pila-modal-upload-area';
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.textContent = 'Upload Image';
    uploadBtn.className = 'pila-modal-upload-btn';
    
    const imagePreview = document.createElement('img');
    imagePreview.className = 'pila-modal-image-preview';
    uploadArea.appendChild(imagePreview);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.setAttribute('form', '');
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (rev) => {
          const dataUrl = rev.target?.result as string;
          this.srcField.value = dataUrl;
          imagePreview.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    };
    
    uploadArea.appendChild(uploadBtn);

    return uploadArea;
  }

  private confirm(): void {
    if (this.resolveFn) {
      this.resolveFn({
        src: this.srcField.value,
        width: this.widthField.value,
        height: this.heightField.value,
        alt: this.altField.value,
        objectFit: this.objectFitField.value as ImagePropsResult['objectFit'],
        borderRadius: this.borderRadiusField.value,
        alignment: this.alignmentField.value as 'left' | 'center' | 'right',
      });
    }
    this.close();
  }

  private cancel(): void {
    if (this.resolveFn) this.resolveFn(null);
    this.close();
  }

  private close(): void {
    if (this.popoverEl) {
      this.popoverEl.remove();
      this.popoverEl = null;
    }
    this.resolveFn = null;
  }
}
