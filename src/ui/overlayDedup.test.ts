import { describe, it, expect, afterEach } from 'vitest';
import { BlockManager } from '../core/BlockManager';
import { SlashMenu } from './SlashMenu';
import { FloatingToolbar } from './FloatingToolbar';
import { ColumnsToolbar } from './ColumnsToolbar';
import { TableToolbar } from './TableToolbar';

describe('Overlay dedup hardening', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('SlashMenu mount is idempotent and cleans up emoji/slash nodes', () => {
    const editor = document.createElement('div');
    document.body.appendChild(editor);

    const manager = new BlockManager([{ id: 'b1', type: 'paragraph', content: [{ text: '' }] }]);
    const slashMenu = new SlashMenu(editor, manager);

    slashMenu.mount();
    slashMenu.mount();

    expect(document.body.querySelectorAll('[data-pila-ui="slash-menu"]').length).toBe(1);
    expect(document.body.querySelectorAll('[data-pila-ui="emoji-popover"]').length).toBe(1);

    slashMenu.destroy();

    expect(document.body.querySelectorAll('[data-pila-ui="slash-menu"]').length).toBe(0);
    expect(document.body.querySelectorAll('[data-pila-ui="emoji-popover"]').length).toBe(0);
  });

  it('FloatingToolbar mount is idempotent', () => {
    const editor = document.createElement('div');
    document.body.appendChild(editor);

    const manager = new BlockManager([{ id: 'b1', type: 'paragraph', content: [{ text: 'x' }] }]);
    const toolbar = new FloatingToolbar(editor, manager);

    toolbar.mount();
    toolbar.mount();

    expect(document.body.querySelectorAll('[data-pila-ui="floating-toolbar"]').length).toBe(1);

    toolbar.destroy();
    expect(document.body.querySelectorAll('[data-pila-ui="floating-toolbar"]').length).toBe(0);
  });

  it('ColumnsToolbar and TableToolbar attach only once per instance', () => {
    const portal = document.createElement('div');
    document.body.appendChild(portal);

    const colToolbar = new ColumnsToolbar(portal);
    const tableToolbar = new TableToolbar(portal);

    expect(portal.querySelectorAll('[data-pila-ui="columns-toolbar"]').length).toBe(1);
    expect(portal.querySelectorAll('[data-pila-ui="table-toolbar"]').length).toBe(1);

    colToolbar.destroy();
    tableToolbar.destroy();

    expect(portal.querySelectorAll('[data-pila-ui="columns-toolbar"]').length).toBe(0);
    expect(portal.querySelectorAll('[data-pila-ui="table-toolbar"]').length).toBe(0);
  });
});
