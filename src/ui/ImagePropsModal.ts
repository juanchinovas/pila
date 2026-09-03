import { BlockAttrs } from '../types';

export interface ImagePropsResult {
  width: string
  height: string
  alt: string
}

export class ImagePropsModal {
  private portalTo: HTMLElement;
  private backdrop!: HTMLDivElement;
  private dialog!: HTMLDivElement;
  private srcField!: HTMLInputElement;
  private confirmBtn!: HTMLButtonElement;
  private cancelBtn!: HTMLButtonElement;

  private resolveFn: ((result: ImagePropsResult | null) => void) | null = null;

  private readonly FIELD_CLASS = 'pila-modal-field';

  private readonly LABEL_CLASS = 'pila-modal-label';

  // BTN_BASE removed; using explicit pila-btn classes for buttons

  constructor(portalTo: HTMLElement = document.body) {
    this.portalTo = portalTo;
    this.buildDOM();
  }

  private buildDOM(): void {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'pila-modal-backdrop';
    this.backdrop.setAttribute('role', 'dialog');
    this.backdrop.setAttribute('aria-modal', 'true');
    this.backdrop.setAttribute('aria-label', 'Image properties');
    this.backdrop.style.display = 'none';

    // Dialog panel
    this.dialog = document.createElement('div');
    this.dialog.className = 'pila-modal-dialog';

    // Title
    const title = document.createElement('h2');
    title.className = 'pila-modal-title';
    title.textContent = 'Image properties';

    // Fields
    const fields = document.createElement('div');
    fields.className = 'pila-modal-fields';
    const separator = document.createElement('div');
    separator.className = 'pila-modal-separator';
    separator.innerHTML = '<span class="pila-modal-sep-text">or</span>';

    const uploadArea = this.makeFileInputField();
    fields.appendChild(uploadArea);
    fields.appendChild(separator);
    fields.appendChild(this.makeField('URL', 'src', false, (el) => {
      this.srcField = el as HTMLInputElement;
      el.addEventListener('input', (ev) => {
        uploadArea.querySelector('img')?.setAttribute('src', ev.target instanceof HTMLInputElement ? ev.target.value : '');
      });
    }));

    // Action row
    const actions = document.createElement('div');
    actions.className = 'pila-modal-actions';

    this.cancelBtn = document.createElement('button');
    this.cancelBtn.type = 'button';
    this.cancelBtn.textContent = 'Cancel';
    this.cancelBtn.className = 'pila-btn pila-btn--cancel';

    this.confirmBtn = document.createElement('button');
    this.confirmBtn.type = 'button';
    this.confirmBtn.textContent = 'Confirm';
    this.confirmBtn.className = 'pila-btn pila-btn--confirm';

    actions.appendChild(this.cancelBtn);
    actions.appendChild(this.confirmBtn);

    this.dialog.appendChild(title);
    this.dialog.appendChild(fields);
    this.dialog.appendChild(actions);
    this.backdrop.appendChild(this.dialog);

    // Events
    this.confirmBtn.addEventListener('click', () => this.confirm());
    this.cancelBtn.addEventListener('click', () => this.cancel());

    this.backdrop.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === this.backdrop) this.cancel();
    });

    this.backdrop.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.cancel();
      }
      if (e.key === 'Enter' && e.target !== this.cancelBtn) {
        e.preventDefault();
        this.confirm();
      }
      // Tab cycling is handled natively — all fields are tabbable
    });
  }

  private makeField(
    labelText: string,
    name: string,
    readOnly: boolean,
    ref: (el: HTMLElement) => void,
  ): HTMLElement {
    const wrapper = document.createElement('div');

    const label = document.createElement('label');
    label.htmlFor = `pila-img-${name}`;
    label.className = this.LABEL_CLASS;
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('form', '');
    input.id = `pila-img-${name}`;
    input.name = name;
    input.className = this.FIELD_CLASS;
    if (readOnly) {
      input.readOnly = true;
      input.tabIndex = -1;
      input.className += ' pila-modal-field--readonly';
    }

    ref(input);
    wrapper.appendChild(label);
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
  /**
   * Opens the modal pre-filled with `attrs` and resolves with the edited
   * values when the user confirms, or `null` when cancelled.
   */
  open(attrs: BlockAttrs): Promise<ImagePropsResult | null> {
    this.srcField.value = attrs.src ?? '';

    this.backdrop.style.display = 'flex';
    this.portalTo.appendChild(this.backdrop);

    return new Promise<ImagePropsResult | null>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  /**
   * Opens the modal for inserting a new image (src field is editable).
   * Resolves with `{ src, ...result }` or `null` when cancelled.
   */
  openInsert(): Promise<(ImagePropsResult & { src: string }) | null> {
    this.srcField.value = '';
    this.srcField.readOnly = false;
    this.srcField.tabIndex = 0;
    this.srcField.className = this.srcField.className
      .replace(' pila-modal-field--readonly', '');

    this.backdrop.style.display = 'flex';
    this.portalTo.appendChild(this.backdrop);

    requestAnimationFrame(() => this.srcField.focus());

    return new Promise<(ImagePropsResult & { src: string }) | null>((resolve) => {
      this.resolveFn = (result) => {
        if (result === null) { resolve(null); return; }
        resolve({ src: this.srcField.value.trim(), ...result });
      };
    });
  }

  private confirm(): void {
    this.close({
      width: '',
      height: '',
      alt: ''
    });
  }

  private cancel(): void {
    this.close(null);
  }

  private close(result: ImagePropsResult | null): void {
    this.backdrop.style.display = 'none';
    if (this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
    if (this.resolveFn) {
      this.resolveFn(result);
      this.resolveFn = null;
    }
  }

  /** Permanently removes the modal from memory. */
  destroy(): void {
    this.close(null);
  }
}
