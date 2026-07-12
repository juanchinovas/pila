import { describe, it, expect } from 'vitest';
import { BlockManager } from '../core/BlockManager';
import { DragHandle } from './DragHandle';

function createEditorAndBlock(blockId: string, text: string): { editorEl: HTMLElement; blockEl: HTMLElement } {
  const editorEl = document.createElement('div');
  document.body.appendChild(editorEl);

  const blockEl = document.createElement('div');
  blockEl.className = 'pila-block';
  blockEl.setAttribute('data-block-id', blockId);

  const editable = document.createElement('p');
  editable.setAttribute('contenteditable', 'true');
  editable.textContent = text;

  blockEl.appendChild(editable);
  editorEl.appendChild(blockEl);

  return { editorEl, blockEl };
}

function openActionsMenu(blockEl: HTMLElement): HTMLElement {
  blockEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

  const dragHandle = document.querySelector<HTMLElement>('.pila-drag-handle');
  if (!dragHandle) throw new Error('Drag handle not found');

  const actionButton = dragHandle.querySelector<HTMLButtonElement>('button[title*="more actions"]');
  if (!actionButton) throw new Error('Drag handle actions button not found');

  actionButton.click();

  const popover = document.querySelector<HTMLElement>('.pila-block-popover');
  if (!popover) throw new Error('Block popover not found');

  return popover;
}

async function openSubmenu(popover: HTMLElement, label: string): Promise<HTMLElement> {
  const item = Array.from(popover.querySelectorAll<HTMLElement>('.pila-popover-item')).find(
    (el) => el.textContent?.includes(label),
  );
  if (!item) throw new Error(`Popover item not found: ${label}`);

  item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

  // Submenu is created in requestAnimationFrame.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const menus = document.querySelectorAll<HTMLElement>('.pila-block-popover');
  const submenu = menus[menus.length - 1];
  if (!submenu) throw new Error(`Submenu not found for: ${label}`);
  return submenu;
}

function chooseColor(submenu: HTMLElement, label: string): void {
  const item = Array.from(submenu.querySelectorAll<HTMLElement>('.pila-popover-item')).find(
    (el) => el.textContent?.includes(label),
  );
  if (!item) throw new Error(`Color option not found: ${label}`);

  item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
}

describe('DragHandle color update content flush', () => {
  it('preserves latest typed content when applying background color through popover', async () => {
    const blockId = 'b1';
    const { editorEl, blockEl } = createEditorAndBlock(blockId, 'Typed now');

    const manager = new BlockManager([
      { id: blockId, type: 'paragraph', content: [{ text: 'Old value' }] },
    ]);

    const handle = new DragHandle(editorEl, manager);
    handle.mount();

    const popover = openActionsMenu(blockEl);
    const backgroundMenu = await openSubmenu(popover, 'Background');
    chooseColor(backgroundMenu, 'Blue');

    const updated = manager.getById(blockId);
    expect(updated?.content).toEqual([{ text: 'Typed now' }]);
    expect(updated?.attrs?.background).toBe('rgba(59, 130, 246, 0.1)');

    handle.destroy();
    editorEl.remove();
  });

  it('stores textColor in attrs when applying a text color update through popover', async () => {
    const blockId = 'b1';
    const { editorEl, blockEl } = createEditorAndBlock(blockId, 'Keep me');

    const manager = new BlockManager([
      {
        id: blockId,
        type: 'paragraph',
        content: [{ text: 'Old value' }],
        attrs: { background: '#fef3c7' },
      },
    ]);

    const handle = new DragHandle(editorEl, manager);
    handle.mount();

    const popover = openActionsMenu(blockEl);
    const textColorMenu = await openSubmenu(popover, 'Text Color');
    chooseColor(textColorMenu, 'Blue');

    const updated = manager.getById(blockId);
    expect(updated?.content).toEqual([{ text: 'Keep me' }]);
    expect(updated?.attrs).toEqual({ background: '#fef3c7', textColor: 'rgb(37, 99, 235)' });

    handle.destroy();
    editorEl.remove();
  });

  it('merges subsequent background and text color updates into attrs through popover', async () => {
    const blockId = 'b1';
    const { editorEl, blockEl } = createEditorAndBlock(blockId, 'Merged attrs');

    const manager = new BlockManager([
      { id: blockId, type: 'paragraph', content: [{ text: 'Old value' }] },
    ]);

    const handle = new DragHandle(editorEl, manager);
    handle.mount();

    const firstPopover = openActionsMenu(blockEl);
    const backgroundMenu = await openSubmenu(firstPopover, 'Background');
    chooseColor(backgroundMenu, 'Blue');

    const secondPopover = openActionsMenu(blockEl);
    const textColorMenu = await openSubmenu(secondPopover, 'Text Color');
    chooseColor(textColorMenu, 'Blue');

    const updated = manager.getById(blockId);
    expect(updated?.attrs).toEqual({ background: 'rgba(59, 130, 246, 0.1)', textColor: 'rgb(37, 99, 235)' });

    handle.destroy();
    editorEl.remove();
  });

  it('clears persisted color attrs when default colors are selected through popover', async () => {
    const blockId = 'b1';
    const { editorEl, blockEl } = createEditorAndBlock(blockId, 'Defaults');

    const manager = new BlockManager([
      {
        id: blockId,
        type: 'paragraph',
        content: [{ text: 'Old value' }],
        attrs: { background: '#dbeafe', textColor: '#1e3a8a' },
      },
    ]);

    const handle = new DragHandle(editorEl, manager);
    handle.mount();

    const firstPopover = openActionsMenu(blockEl);
    const backgroundMenu = await openSubmenu(firstPopover, 'Background');
    chooseColor(backgroundMenu, 'Default');

    const secondPopover = openActionsMenu(blockEl);
    const textColorMenu = await openSubmenu(secondPopover, 'Text Color');
    chooseColor(textColorMenu, 'Default');

    const updated = manager.getById(blockId);
    expect(updated?.content).toEqual([{ text: 'Defaults' }]);
    expect(updated?.attrs).toBeUndefined();

    handle.destroy();
    editorEl.remove();
  });
});
