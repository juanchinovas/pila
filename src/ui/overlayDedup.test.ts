import { describe, it, expect, afterEach } from 'vitest';
import { BlockManager } from '../core/BlockManager';
import { SlashMenu } from './SlashMenu';
import { FloatingToolbar } from './FloatingToolbar';
import { PluginRegistry } from '@/core/PluginRegistry';

describe('Overlay dedup hardening', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('SlashMenu mount is idempotent and cleans up emoji/slash nodes', () => {
    const editor = document.createElement('div');
    document.body.appendChild(editor);

    const manager = new BlockManager([{ id: 'b1', type: 'paragraph', content: [{ text: '' }] }]);
    const pluginRegistry = new PluginRegistry();
    const slashMenu = new SlashMenu(editor, manager, pluginRegistry);

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
});
