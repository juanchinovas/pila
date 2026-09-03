import { debounce, generateId, toCustomEvent } from '@/core/utils';
import { icon, Icons } from './icons';
import { portalViewportBounds, setPortalPosition, viewportPointToPortal } from './overlayPosition';
import { EventRegistry } from '@/core/EventRegistry';

export interface BlockAction {
  label: string;
  type: 'color' | 'action' | 'divider';
  value?: unknown;
  icon?: keyof typeof Icons;
  shortcut?: string;
  danger?: boolean;
  color?: string;
  isStatic?: boolean;
  handler?: (e: CustomEvent<BlockAction>) => void;
  children?: BlockAction[];
}

export class BlockPopover {
  private portalTo: HTMLElement;
  private popoverEl: HTMLElement | null = null;
  private activeSubmenu: HTMLElement | null = null;
  private onKeyDownBound = this.handleKeyDown.bind(this);
  private onClickOutsideBound = this.handleClickOutside.bind(this);
  private selectedIndex = -1;
  private eventRegistry = new EventRegistry();

  constructor(portalTo: HTMLElement = document.body) {
    this.portalTo = portalTo;
  }

  open(x: number, y: number, actions: BlockAction[]): void {
    this.close();
    this.popoverEl = this.renderActions(actions);
    this.portalTo.appendChild(this.popoverEl);
    
    // Position
    this.popoverEl.style.position = 'absolute';
    setPortalPosition(this.popoverEl, this.portalTo, x, y);
    this.popoverEl.style.zIndex = '10000';

    // Events
    this.eventRegistry.on(document, 'keydown', this.onKeyDownBound, true);
    this.eventRegistry.on(document, 'mousedown', this.onClickOutsideBound, true);
  }

  private renderActions(actions: BlockAction[], isSubmenuChild: boolean = false): HTMLElement {
    const el = document.createElement('div');
    el.id = generateId();
    el.className = 'pila-block-popover';
    
    // Set a smaller width for submenus if they contain colors
    if (actions.some(a => a.color)) {
      el.style.width = '180px';
    } else {
      el.style.width = '240px';
    }

    actions.forEach((action, aId) => {
      const item = document.createElement('div');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.dataset.index = aId.toString();
      item.dataset.hasChildren = action.children ? 'true' : 'false';
      item.dataset.isSubmenuChild = isSubmenuChild ? 'true' : 'false';
      item.id = `pila-popover-item-${el.id}-${aId.toString()}`;
      item.className = `pila-popover-item ${action.danger ? 'pila-popover-item--danger' : ''} ${action.type === 'divider' ? 'pila-popover-item--divider' : ''}`;
      
      const iconWrap = document.createElement('span');
      iconWrap.className = 'pila-popover-icon';
      
      if (action.color) {
        const circle = document.createElement('span');
        circle.style.width = '12px';
        circle.style.height = '12px';
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = action.color;
        circle.style.border = '1px solid var(--pila-border)';
        // Ensure valid color for CSS, otherwise transparent
        if (action.color === 'transparent') {
          circle.style.background = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)';
          circle.style.backgroundSize = '4px 4px';
          circle.style.backgroundPosition = '0 0, 2px 2px';
        }
        iconWrap.appendChild(circle);
      }
      
      if (action.icon) {
        const _icon = Icons[action.icon] ? icon(Icons[action.icon], 16) : document.createTextNode(action.icon);
        iconWrap.appendChild(_icon);
      }
      
      const label = document.createElement('span');
      label.className = 'pila-popover-label';
      label.textContent = action.label;

      if (action.type === 'color' && !action.isStatic) {
        const input = document.createElement('input');
        input.type = 'color';
        input.setAttribute('form', '');
        input.className = 'pila-custom-color-input';
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.value = (action.color ?? action.value ?? '#000000') as string;
        input.id = `pila-popover-item-color-${el.id}-${aId}`;
        label.setAttribute('for', input.id);
        this.eventRegistry.on(input, 'input', debounce((ev: Event) => {
          if (action.handler) {
            const inputEl = ev.target as HTMLInputElement;
            action.value = inputEl.value;
            action.handler(toCustomEvent(ev, action));
          }
        }));

        item.appendChild(input);
      }
      
      item.appendChild(iconWrap);
      item.appendChild(label);
      
      if (action.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.className = 'pila-popover-shortcut';
        shortcut.textContent = action.shortcut;
        item.appendChild(shortcut);
      }

      if (action.children) {
        const arrow = document.createElement('span');
        arrow.style.marginLeft = 'auto';
        arrow.style.opacity = '0.5';
        arrow.innerHTML = '&#9656;'; // Small right arrow
        item.appendChild(arrow);
      }
      
      if (action.type !== 'divider') {
        this.eventRegistry.on(item, 'mousedown', (e) => {
          if (action.handler) {
            e.preventDefault();
            e.stopPropagation();
            action.handler(toCustomEvent(e, action));
            // Don't close if it's a special input or we want it to stay open
            // But usually we close. For custom color inputs, we'll need to handle it.
            if (!(e.target as HTMLElement).closest('.pila-custom-color-input')) {
              this.close();
            }
          }
        });

        this.eventRegistry.on(item, 'mouseenter', () => {
          if (item.dataset.hasChildren !== 'true' && item.dataset.isSubmenuChild !== 'true') {
            this.closeSubmenu();
          }

          if (item.dataset.hasChildren === 'true' && item.dataset.isSubmenuChild !== 'true') {
            // Use a small delay for submenu opening to improve UX
            return void requestAnimationFrame(() => {
              this.closeSubmenu();
              const rect = item.getBoundingClientRect();
              this.openSubmenu(rect.right + 2, rect.top - 4, action.children!);
            });
          }

        });
      }

      el.appendChild(item);
    });

    return el;
  }

  private openSubmenu(x: number, y: number, actions: BlockAction[]): void {
    this.closeSubmenu();
    this.activeSubmenu = this.renderActions(actions, true);
    this.portalTo.appendChild(this.activeSubmenu);
    
    // Ensure the submenu stays within the viewport
    this.activeSubmenu.style.position = 'absolute';
    setPortalPosition(this.activeSubmenu, this.portalTo, x, y);
    this.activeSubmenu.style.zIndex = '10001';
    this.activeSubmenu.style.minWidth = '140px';
    this.activeSubmenu.style.width = 'auto'; // Allow submenu to be narrower than parent

    const rect = this.activeSubmenu.getBoundingClientRect();
    const bounds = portalViewportBounds(this.portalTo);
    if (rect.right > bounds.right) {
      // Flip left if it overflows, and ensure a small gap from main menu
      const parentWidth = this.popoverEl?.offsetWidth ?? 240;
      const leftPos = viewportPointToPortal(this.portalTo, x - rect.width - parentWidth - 4, y);
      this.activeSubmenu.style.left = `${leftPos.x}px`; 
    }
  }

  private closeSubmenu(): void {
    if (this.activeSubmenu) {
      this.activeSubmenu.remove();
      this.activeSubmenu = null;
    }
  }

  close(): void {
    this.eventRegistry.unsubscribeAll();
    if (this.popoverEl) {
      this.closeSubmenu();
      this.popoverEl.remove();
      this.popoverEl = null;
      this.selectedIndex = -1;
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    const target = e.target as Node;
    // Check if the click is inside any active popover or submenu
    const isInsideMain = this.popoverEl?.contains(target);
    const isInsideSub = this.activeSubmenu?.contains(target);
    
    if (!isInsideMain && !isInsideSub) {
      this.close();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.close();
      return;
    }

    if (!this.popoverEl) return;

    const items = Array.from(this.popoverEl.querySelectorAll('.pila-popover-item')) as HTMLElement[];
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      this.updateSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      this.updateSelection(items);
    } else if (e.key === 'Enter') {
      if (this.selectedIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        items[this.selectedIndex]?.click();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      } else {
        this.selectedIndex = (this.selectedIndex + 1) % items.length;
      }
      this.updateSelection(items);
    }
  }

  private updateSelection(items: HTMLElement[]): void {
    items.forEach((item, idx) => {
      item.classList.toggle('pila-popover-item--selected', idx === this.selectedIndex);
    });
    items[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }
}
