import { PluginRegistry } from '../core/PluginRegistry';
import { EmojiItem } from '../types';
import { setPortalPosition } from './overlayPosition';

export class EmojiPopover {
  private editorEl: HTMLElement;
  private plugins: PluginRegistry;
  private portalTo: HTMLElement;
  private menuEl!: HTMLElement;
  private target!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private activeBlockId: string | null = null;
  private filter = '';
  private selectedIndex = 0;
  private filteredItems: EmojiItem[] = [];
  private onClickOutsideBound = this.handleClickOutside.bind(this);
  private onFilterInput!: () => void;
  private onFilterKeyDown!: (e: KeyboardEvent) => void;
  private mounted = false;
  private searchRequestId = 0;
  
  constructor(editorEl: HTMLElement, plugins: PluginRegistry, portalTo: HTMLElement = document.body) {
    this.editorEl = editorEl;
    this.plugins = plugins;
    this.portalTo = portalTo;
    this.mount();
  }

  private mount(): void {
    if (this.mounted) {
      if (this.menuEl && !this.menuEl.isConnected) this.portalTo.appendChild(this.menuEl);
      return;
    }

    this.menuEl = document.createElement('div');
    this.menuEl.className = 'pila-slash-menu pila-emoji-popover flex flex-col';
    this.menuEl.dataset.pilaUi = 'emoji-popover';
    this.menuEl.style.display = 'none';
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'pila-emoji-filter-container p-2 border-b border-gray-100';
    
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.setAttribute('form', '');
    this.inputEl.placeholder = 'Filter emojis...';
    this.inputEl.className = 'pila-emoji-filter-input w-full border border-gray-200 rounded px-2 py-1 outline-none text-sm';
    
    filterContainer.appendChild(this.inputEl);
    this.menuEl.appendChild(filterContainer);

    const listEl = document.createElement('div');
    listEl.className = 'pila-emoji-list max-h-[200px] overflow-y-auto p-1';
    this.menuEl.appendChild(listEl);

    this.portalTo.appendChild(this.menuEl);

    this.onFilterInput = () => {
      this.filter = this.inputEl.value.toLowerCase();
      this.selectedIndex = 0;
      void this.refreshItems();
    };
    this.inputEl.addEventListener('input', this.onFilterInput);

    this.onFilterKeyDown = (e: KeyboardEvent) => { this.handleKeyDown(e); };
    this.inputEl.addEventListener('keydown', this.onFilterKeyDown);
    this.mounted = true;
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.isOpen()) return false;

    if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this.moveSelection(1); return true; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); e.stopPropagation(); this.moveSelection(-1); return true; }
    if (e.key === 'Tab')       { 
      e.preventDefault(); 
      e.stopPropagation(); 
      this.moveSelection(e.shiftKey ? -1 : 1); 
      return true; 
    }
    if (e.key === 'Enter')     { e.preventDefault(); e.stopPropagation(); this.confirm(); return true; }
    if (e.key === 'Escape')    { e.stopPropagation(); this.close(); return true; }
    if (e.key === ' ')         { this.close(); return false; }

    return false;
  }

  handleInput(e: Event): void {
    this.target = e.target as HTMLElement;
    if (!this.target.hasAttribute('contenteditable')) return;

    const text = this.target.textContent ?? '';
    const colonIdx = text.lastIndexOf(':');

    // Only open if the colon is the last character or followed by filter text with no spaces
    if (colonIdx !== -1 && (colonIdx === 0 || text[colonIdx - 1] === ' ')) {
      const rest = text.slice(colonIdx + 1);

      if (!rest.includes(' ')) {
        this.activeBlockId = this.target.dataset.blockId ?? null;
        this.filter = rest.toLowerCase();
        this.selectedIndex = 0;
        void this.refreshItems();
        return;
      }
    }
    
    this.close();
  }

  private async refreshItems(): Promise<void> {
    const requestId = ++this.searchRequestId;
    const target = this.target;
    if (!target) {
      this.close();
      return;
    }

    const results = await this.plugins.queryEmoji(this.filter, {
      editorEl: this.editorEl,
      activeBlockId: this.activeBlockId,
      target,
      textBeforeCaret: target.textContent ?? '',
    });

    if (requestId !== this.searchRequestId) return;

    this.filteredItems = results.slice(0, 50);
    this.renderItems();

    if (this.filteredItems.length === 0) {
      this.close();
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.positionAtRange(selection.getRangeAt(0));
    } else {
      this.positionAt(target);
    }
    this.show();
  }

  private renderItems(): void {

    const listEl = this.menuEl.querySelector('.pila-emoji-list') as HTMLElement;
    if (!listEl) return;
    listEl.innerHTML = '';

    if (this.filteredItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'px-2 py-4 text-center text-gray-400 text-sm';
      empty.textContent = 'No emojis found';
      listEl.appendChild(empty);
      return;
    }

    this.filteredItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'flex gap-1 items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100';
      row.tabIndex = 0;
      if (idx === this.selectedIndex) {
        row.classList.add('bg-gray-100');
      }
      
      const emoji = document.createElement('span');
      emoji.className = 'pila-slash-icon !bg-transparent text-lg';
      emoji.textContent = item.emoji;

      const name = document.createElement('span');
      name.className = 'pila-slash-name';
      name.textContent = `:${item.name}:`;

      row.appendChild(emoji);
      row.appendChild(name);

      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = idx;
        this.confirm();
      });

      row.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.selectedIndex = idx;
          this.confirm();
        }
      });
      listEl.appendChild(row);
    });
  }

  private moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + this.filteredItems.length) % this.filteredItems.length;
    this.renderItems();
    const listEl = this.menuEl.querySelector('.pila-emoji-list') as HTMLElement;
    const selected = listEl?.children[this.selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }

  private confirm(): void {
    const item = this.filteredItems[this.selectedIndex];
    if (!item) return;

    const contentEl = this.editorEl.querySelector(
      `[data-block-id="${this.activeBlockId}"][contenteditable=true]`
    ) as HTMLElement | null ?? this.target;
    
    if (contentEl) {
      const text = contentEl.textContent ?? '';
      const colonIdx = text.lastIndexOf(':');
      if (colonIdx !== -1) {
        // Replace from the colon to the end of the text
        const before = text.slice(0, colonIdx);
        const newText = before + (item.insertText ?? item.emoji);
        contentEl.innerText = newText;
        
        // Position cursor after emoji
        const firstNode = contentEl.firstChild || contentEl;
        const range = document.createRange();
        const sel = window.getSelection();
        
        try {
          range.setStart(firstNode, newText.length);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        } catch {
          contentEl.focus();
        }
        
        contentEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    this.close();
  }

  private positionAt(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    setPortalPosition(this.menuEl, this.portalTo, rect.left, rect.bottom + 4);
  }

  private positionAtRange(range: Range): void {
    if (typeof range.getBoundingClientRect !== 'function') {
      this.positionAt(this.target);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height && !rect.left && !rect.top) {
      this.positionAt(this.target);
      return;
    }
    setPortalPosition(this.menuEl, this.portalTo, rect.left, rect.bottom + 4);
  }

  private show(): void {
    this.menuEl.style.display = 'flex';
    document.addEventListener('mousedown', this.onClickOutsideBound, true);
    this.inputEl.value = this.filter;
    requestAnimationFrame(() => this.inputEl.focus());
  }

  private close(): void {
    this.menuEl.style.display = 'none';
    this.activeBlockId = null;
    this.filter = '';
    this.selectedIndex = 0;
    this.searchRequestId += 1;
    document.removeEventListener('mousedown', this.onClickOutsideBound, true);
  }

  private handleClickOutside(e: MouseEvent): void {
    if (this.menuEl && !this.menuEl.contains(e.target as Node)) {
      this.close();
    }
  }

  private isOpen(): boolean {
    return this.menuEl.style.display !== 'none';
  }

  destroy(): void {
    if (!this.mounted) return;
    this.close();
    this.inputEl?.removeEventListener('input', this.onFilterInput);
    this.inputEl?.removeEventListener('keydown', this.onFilterKeyDown);
    this.menuEl?.remove();
    this.mounted = false;
  }
}
