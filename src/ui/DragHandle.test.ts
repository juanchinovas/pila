import { describe, it, expect } from 'vitest';
import { BlockManager } from '../core/BlockManager';
import { DragHandle } from './DragHandle';

describe('DragHandle color update content flush', () => {
  it('preserves latest typed content when applying attrs-only color update', () => {
    const editorEl = document.createElement('div');

    const blockId = 'b1';
    const blockEl = document.createElement('div');
    blockEl.className = 'pila-block';
    blockEl.setAttribute('data-block-id', blockId);

    const editable = document.createElement('p');
    editable.setAttribute('contenteditable', 'true');
    editable.textContent = 'Typed now';

    blockEl.appendChild(editable);
    editorEl.appendChild(blockEl);

    const manager = new BlockManager([
      { id: blockId, type: 'paragraph', content: [{ text: 'Old value' }] },
    ]);

    const handle = new DragHandle(editorEl, manager);

    // Access private helper through `any` to verify the regression path directly.
    (handle as any).updateBlockAttrsWithLiveContent(blockId, { background: 'rgba(1, 2, 3, 0.1)' });

    const updated = manager.getById(blockId);
    expect(updated?.content).toEqual([{ text: 'Typed now' }]);
    expect(updated?.attrs?.background).toBe('rgba(1, 2, 3, 0.1)');
  });

  it('stores textColor in attrs when applying a text color update', () => {
    const editorEl = document.createElement('div');

    const blockId = 'b1';
    const blockEl = document.createElement('div');
    blockEl.className = 'pila-block';
    blockEl.setAttribute('data-block-id', blockId);

    const editable = document.createElement('p');
    editable.setAttribute('contenteditable', 'true');
    editable.textContent = 'Keep me';

    blockEl.appendChild(editable);
    editorEl.appendChild(blockEl);

    const manager = new BlockManager([
      {
        id: blockId,
        type: 'paragraph',
        content: [{ text: 'Old value' }],
        attrs: { background: '#fef3c7' },
      },
    ]);

    const handle = new DragHandle(editorEl, manager);

    (handle as any).updateBlockAttrsWithLiveContent(blockId, { textColor: '#1d4ed8' });

    const updated = manager.getById(blockId);
    expect(updated?.content).toEqual([{ text: 'Keep me' }]);
    expect(updated?.attrs).toEqual({ background: '#fef3c7', textColor: '#1d4ed8' });
  });

  it('merges subsequent background and text color updates into attrs', () => {
    const editorEl = document.createElement('div');

    const blockId = 'b1';
    const blockEl = document.createElement('div');
    blockEl.className = 'pila-block';
    blockEl.setAttribute('data-block-id', blockId);

    const editable = document.createElement('p');
    editable.setAttribute('contenteditable', 'true');
    editable.textContent = 'Merged attrs';

    blockEl.appendChild(editable);
    editorEl.appendChild(blockEl);

    const manager = new BlockManager([
      { id: blockId, type: 'paragraph', content: [{ text: 'Old value' }] },
    ]);

    const handle = new DragHandle(editorEl, manager);

    (handle as any).updateBlockAttrsWithLiveContent(blockId, { background: '#dbeafe' });
    (handle as any).updateBlockAttrsWithLiveContent(blockId, { textColor: '#1e3a8a' });

    const updated = manager.getById(blockId);
    expect(updated?.attrs).toEqual({ background: '#dbeafe', textColor: '#1e3a8a' });
  });

  it('clears persisted color attrs when default colors are selected', () => {
    const editorEl = document.createElement('div');

    const blockId = 'b1';
    const blockEl = document.createElement('div');
    blockEl.className = 'pila-block';
    blockEl.setAttribute('data-block-id', blockId);

    const editable = document.createElement('p');
    editable.setAttribute('contenteditable', 'true');
    editable.textContent = 'Defaults';

    blockEl.appendChild(editable);
    editorEl.appendChild(blockEl);

    const manager = new BlockManager([
      {
        id: blockId,
        type: 'paragraph',
        content: [{ text: 'Old value' }],
        attrs: { background: '#dbeafe', textColor: '#1e3a8a' },
      },
    ]);

    const handle = new DragHandle(editorEl, manager);

    (handle as any).updateBlockAttrsWithLiveContent(blockId, { background: undefined });
    (handle as any).updateBlockAttrsWithLiveContent(blockId, { textColor: undefined });

    const updated = manager.getById(blockId);
    expect(updated?.content).toEqual([{ text: 'Defaults' }]);
    expect(updated?.attrs).toBeUndefined();
  });
});
