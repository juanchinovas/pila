import { afterEach, describe, expect, it } from 'vitest';
import { PilaEditor } from './Editor';
import { PilaPlugin, Block } from '../types';

interface ManagerLike {
  getById(id: string): Block | undefined;
  update(id: string, changes: Partial<Omit<Block, 'id'>>): Block | undefined;
}

function getManager(editor: PilaEditor): ManagerLike {
  return (editor as unknown as { manager: ManagerLike }).manager;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

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
    toolbarButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(host.dataset.pluginToolbar).toBe('clicked');

    editor.destroy();
  });

  it('preserves freshly typed content across an attrs-only manager update', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = new PilaEditor(host, {
      initialContent: [{ type: 'paragraph', content: [{ text: 'hello' }] }],
    });
    editor.mount();
    await flush();

    const contentEl = host.querySelector<HTMLElement>('p[contenteditable]')!;
    const blockId = contentEl.dataset.blockId!;

    // Simulate the user typing more text — this only updates the instance-local
    // content and the DOM, never the BlockManager (same as the demo plugin marker).
    contentEl.textContent = 'hello world!';
    contentEl.dispatchEvent(new Event('input', { bubbles: true }));

    getManager(editor).update(blockId, { attrs: { background: '#ffffff' } });
    await flush();

    expect(contentEl.textContent).toBe('hello world!');

    editor.destroy();
  });

  it('does not rebuild the contenteditable DOM when an update reports identical content', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = new PilaEditor(host, {
      initialContent: [{ type: 'paragraph', content: [{ text: 'hello' }] }],
    });
    editor.mount();
    await flush();

    const contentEl = host.querySelector<HTMLElement>('p[contenteditable]')!;
    const blockId = contentEl.dataset.blockId!;

    // Simulate the debounced typing flush: the manager reports content that is
    // byte-identical to what is already live in the DOM. The contenteditable
    // must not be rebuilt — rebuilding would reset the caret mid-edit.
    contentEl.textContent = 'hello world!';
    contentEl.dispatchEvent(new Event('input', { bubbles: true }));
    const firstChild = contentEl.firstChild;

    getManager(editor).update(blockId, { content: [{ text: 'hello world!' }] });
    await flush();

    expect(contentEl.textContent).toBe('hello world!');
    expect(contentEl.firstChild).toBe(firstChild);

    editor.destroy();
  });

  it('renders content explicitly provided via manager.update (programmatic updates win)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = new PilaEditor(host, {
      initialContent: [{ type: 'paragraph', content: [{ text: 'hello' }] }],
    });
    editor.mount();
    await flush();

    const contentEl = host.querySelector<HTMLElement>('p[contenteditable]')!;
    const blockId = contentEl.dataset.blockId!;

    contentEl.textContent = 'hello world!';
    contentEl.dispatchEvent(new Event('input', { bubbles: true }));

    getManager(editor).update(blockId, { content: [{ text: 'replaced' }] });
    await flush();

    expect(contentEl.textContent).toBe('replaced');

    editor.destroy();
  });

  it('splits a block on Enter and keeps the pre-caret content', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = new PilaEditor(host, {
      initialContent: [{ type: 'paragraph', content: [{ text: 'helloworld' }] }],
    });
    editor.mount();
    await flush();

    const contentEl = host.querySelector<HTMLElement>('p[contenteditable]')!;

    // Place the caret after "hello"
    const range = document.createRange();
    range.setStart(contentEl.firstChild!, 5);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    contentEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();

    expect(contentEl.textContent).toBe('hello');
    expect(host.querySelectorAll('p[contenteditable]')).toHaveLength(2);
    expect(host.querySelectorAll('p[contenteditable]')[1]!.textContent).toBe('world');

    editor.destroy();
  });

  it('merges a block into the previous one on Backspace at the start', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const editor = new PilaEditor(host, {
      initialContent: [
        { type: 'paragraph', content: [{ text: 'hello' }] },
        { type: 'paragraph', content: [{ text: 'world' }] },
      ],
    });
    editor.mount();
    await flush();

    const paras = host.querySelectorAll<HTMLElement>('p[contenteditable]');
    const second = paras[1]!;

    // Place the caret at the very start of the second block
    const range = document.createRange();
    range.setStart(second.firstChild!, 0);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await flush();

    const after = host.querySelectorAll<HTMLElement>('p[contenteditable]');
    expect(after).toHaveLength(1);
    expect(after[0]!.textContent).toBe('helloworld');

    editor.destroy();
  });
});
