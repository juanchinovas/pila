import { afterEach, describe, expect, it } from 'vitest';
import { PilaEditor } from './Editor';
import { PilaPlugin } from '../types';

describe('PilaEditor UI integration', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a seed paragraph when initialized empty', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = new PilaEditor(host, { initialContent: [] });
    editor.mount();
    await Promise.resolve();
    await Promise.resolve();

    const blocks = host.querySelectorAll('.pila-editor > .pila-block');
    expect(blocks.length).toBe(1);
    expect(blocks[0].tagName.toLowerCase()).toBe('pila-paragraph');

    editor.destroy();
  });

  it('renders floating UI in custom portal target', () => {
    const host = document.createElement('div');
    const portal = document.createElement('div');
    portal.id = 'portal-root';
    document.body.append(host, portal);

    const editor = new PilaEditor(host, {
      initialContent: [{ type: 'paragraph', content: [{ text: 'hello' }] }],
      portalTo: portal,
    });

    editor.mount();

    expect(portal.querySelector('[data-pila-ui="slash-menu"]')).toBeTruthy();
    expect(portal.querySelector('[data-pila-ui="floating-toolbar"]')).toBeTruthy();
    expect(portal.querySelector('.pila-drag-handle')).toBeTruthy();
    expect(portal.querySelector('.pila-drop-indicator')).toBeTruthy();

    editor.destroy();

    expect(portal.querySelector('[data-pila-ui="slash-menu"]')).toBeNull();
    expect(portal.querySelector('[data-pila-ui="floating-toolbar"]')).toBeNull();
    expect(portal.querySelector('.pila-drag-handle')).toBeNull();
    expect(portal.querySelector('.pila-drop-indicator')).toBeNull();
  });

  it('does not leak editor roots/overlay nodes across repeated mount and destroy', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    for (let i = 0; i < 30; i += 1) {
      const editor = new PilaEditor(host, {
        initialContent: [{ type: 'paragraph', content: [{ text: `round-${i}` }] }],
      });
      editor.mount();
      editor.destroy();
    }

    expect(host.querySelectorAll('.pila-editor').length).toBe(0);
    expect(document.body.querySelectorAll('[data-pila-ui="slash-menu"]').length).toBe(0);
    expect(document.body.querySelectorAll('[data-pila-ui="floating-toolbar"]').length).toBe(0);
    expect(document.body.querySelectorAll('.pila-drag-handle').length).toBe(0);
    expect(document.body.querySelectorAll('.pila-drop-indicator').length).toBe(0);
  });

  it('renders plugin toolbar buttons from installed plugins', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const plugin: PilaPlugin = {
      name: 'ui-plugin',
      install(api) {
        api.addToolbarButton({
          label: '★',
          title: 'Plugin Action',
          command: () => {
            host.dataset.pluginToolbar = 'clicked';
          },
        });
      },
    };

    const editor = new PilaEditor(host, {
      initialContent: [{ type: 'paragraph', content: [{ text: 'Type here' }] }],
      plugins: [plugin],
    });

    editor.mount();
    await Promise.resolve();
    await Promise.resolve();

    const toolbarButton = document.querySelector<HTMLButtonElement>('[data-pila-ui="floating-toolbar"] button[title="Plugin Action"]');
    expect(toolbarButton).toBeTruthy();
    toolbarButton?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(host.dataset.pluginToolbar).toBe('clicked');

    editor.destroy();
  });
});
