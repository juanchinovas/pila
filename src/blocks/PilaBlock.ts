import { LitElement, html } from 'lit';
import type { TemplateResult } from 'lit';
import { Block, InlineNode } from '../types';
import { BlockManager } from '../core/BlockManager';
import { InlineParser } from '../inline/InlineParser';
import { InlineRenderer } from '../inline/InlineRenderer';
import { MarkdownShortcuts } from '../inline/MarkdownShortcuts';
import type { BlockAction } from '../ui/BlockPopover';
import { PluginRegistry } from '@/core/PluginRegistry';
import { EventRegistry } from '@/core/EventRegistry';
import { debounce } from '@/core/utils';

export interface BlockContext {
  manager: BlockManager;
  pluginRegistry: PluginRegistry;
  editorEl: HTMLElement;
  placeholder?: string;
  portalTo?: HTMLElement;
}

/**
 * Abstract base class for all Pila block web components.
 *
 * Extends LitElement but operates in **light DOM** so Tailwind utility classes
 * from the host page apply normally inside every block.
 *
 * Design notes
 * ─────────────
 * • `block` and `ctx` are plain instance properties (not Lit reactive).
 *   Making `block` reactive would trigger a re-render on every keystroke,
 *   clobbering the caret position. Call `requestRerender()` explicitly when a
 *   structural update (type switch, attrs change) is needed.
 *
 * • `buildDOM()` is abstract and called once from `firstUpdated()`, after
 *   Lit's first render has placed its comment markers in the DOM. Any elements
 *   appended to `this` after that point are outside Lit's managed range and
 *   are never touched by subsequent re-renders. This mirrors the old
 *   `BaseBlock.buildDOM()` contract exactly.
 *
 * • `render()` returns an empty template. Its sole purpose is to allow Lit to
 *   complete its first update cycle and fire `firstUpdated()`.
 *
 * Migration path
 * ──────────────
 * Phase 1: blocks extend `PilaBlock` and keep their existing `buildDOM()`
 *           implementation. They work identically to `BaseBlock`-derived blocks.
 * Phase 2+: individual blocks replace `buildDOM()` with a full Lit `render()`
 *            template using Tailwind classes.
 */
export abstract class PilaBlock extends LitElement {
  // ─── Light DOM ────────────────────────────────────────────────────────────

  /**
   * Return `this` as the render root so there is no shadow root.
   * Tailwind classes defined on the host page penetrate into this element.
   */
  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this as HTMLElement;
  }

  // ─── Instance properties (intentionally non-reactive) ────────────────────

  block!: Block;
  ctx!: BlockContext;
  protected eventGroup = new EventRegistry();

  /**
   * Serialized content the BlockManager last reported for this block.
   * Used by `updateData` to detect whether an update explicitly changed content
   * (Enter split, Backspace merge, programmatic `manager.update`, …) versus an
   * attrs-only refresh where the manager still holds stale content and the live
   * DOM (what the user typed) is authoritative.
   */
  private syncedContentKey: string | null = null;

  /**
   * Whether the most recent `updateData` actually changed this block's content
   * relative to the live DOM. Subclasses re-render their contenteditable only
   * when this is true — rebuilding an identical DOM destroys the caret, which
   * makes subsequent typed characters appear at the front ("reversed word").
   */
  protected contentNeedsRerender = false;

  /**
   * Debounced flush of live typed content to the BlockManager.
   * Fires after the user pauses typing, keeping the manager copy in sync
   * without triggering `blocks:change` → `renderAll()` on every keystroke.
   */
  private readonly flushContent = debounce(() => {
    if (!this.isConnected) return;
    const el = this.contentEditableEl;
    if (!el || this.block?.content === undefined) return;
    this.ctx.manager.update(this.block.id!, { content: InlineParser.parse(el) });
  }, 350);

  // ─── Lit lifecycle ────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    // Required by DragHandle which queries `.pila-block[data-block-id]`
    this.classList.add('pila-block');
  }

  /**
   * Default render — empty template.
   * Subclasses that adopt full Lit templates override this.
   * Those that keep `buildDOM()` leave this as-is.
   */
  override render(): TemplateResult {
    return html``;
  }

  override firstUpdated(): void {
    this._syncHostAttrs();
    if (this.block) {
      this.syncedContentKey = JSON.stringify(this.block.content ?? null);
      this.buildDOM();
    }
  }

  // ─── Public API (mirrors BaseBlock) ──────────────────────────────────────

  /** The block type this instance was created for. */
  get blockType(): string {
    return this.block?.type ?? '';
  }

  /** Override to return the contenteditable element for live content parsing. */
  protected get contentEditableEl(): HTMLElement | null {
    return null;
  }

  /**
   * Whether this block supports the generic background / text-color submenu
   * in the drag-handle popover. Override to `return false` in blocks that
   * manage their own styling (code, table, image, button, columns, row).
   */
  get colorOptions(): boolean {
    return true;
  }

  /**
   * Popover actions shown when the user clicks the drag-handle grip.
   * The base class provides **Duplicate** and **Delete** — the two common
   * actions that every block should have.
   *
   * Override in subclasses to prepend / append block-specific actions.
   * Always call `super.getPopoverActions()` to include the defaults.
   */
  getPopoverActions(): BlockAction[] {
    return [
      {
        label: 'Duplicate',
        icon: 'Copy',
        type: 'action',
        shortcut: '⌘D',
        handler: () => this.ctx.manager.duplicate(this.block.id!),
      },
      {
        label: 'Delete',
        icon: 'Trash2',
        type: 'action',
        shortcut: 'Del',
        danger: true,
        handler: () => this.ctx.manager.remove(this.block.id!),
      },
    ];
  }

  /**
   * Sync new block data without triggering a full Lit re-render.
   * Called by Editor.ts on every `blocks:change` event.
   * Override in individual blocks to additionally update live DOM state
   * (e.g. alignment).
   */
  updateData(newBlock: Block): void {
    // Fallback in case updateData runs before firstUpdated() (block set by the
    // editor before the element is connected, so its content is still pristine).
    if (this.syncedContentKey === null) {
      this.syncedContentKey = JSON.stringify(this.block?.content ?? null);
    }

    const liveContent = this.contentEditableEl ? InlineParser.parse(this.contentEditableEl) : null;
    const contentChanged = JSON.stringify(newBlock.content ?? null) !== this.syncedContentKey;

    if (contentChanged) {
      // The manager explicitly changed this block's content — it is authoritative.
      this.block = newBlock;
      this.syncedContentKey = JSON.stringify(newBlock.content ?? null);
    } else {
      // The manager didn't touch content this round, so its copy may be stale.
      // Preserve live content from the DOM if available.
      this.block = { ...newBlock, content: liveContent ?? newBlock.content };
    }

    // Only re-render the contenteditable when the incoming content differs from
    // what's already live in the DOM. If they're identical (attrs-only refresh,
    // debounced typing flush, Enter-split/Backspace-merge pre-renders) the DOM is
    // already correct — rebuilding it would reset the caret mid-edit.
    this.contentNeedsRerender =
      JSON.stringify(this.block.content ?? null) !== JSON.stringify(liveContent ?? null);

    this._syncHostAttrs();
    this.applyGlobalStyles();
  }

  private applyGlobalStyles(): void {
    const { background, textColor } = this.block.attrs ?? {};
    this.style.backgroundColor = background ?? '';
    this.style.color = textColor ?? '';
  }

  /**
   * Trigger a full Lit re-render.
   * Use only for structural changes (type switch, attrs changes that alter
   * the DOM shape), not for content-only changes caused by user typing.
   */
  requestRerender(): void {
    this.requestUpdate();
  }

  abstract getContent(): Block;

  /**
   * Move the editing caret into this block.
   * Named `focusBlock` to avoid collision with `HTMLElement.focus(options?)`.
   */
  abstract focusBlock(offset?: number): void;

  /**
   * Build the block's inner DOM.
   * Called exactly once, after the first Lit render cycle.
   * Subclasses may replace this with a Lit `render()` template in Phase 2+.
   */
  protected abstract buildDOM(): void;

  /** Remove this element from the DOM and clean up. */
  destroy(): void {
    this.eventGroup.unsubscribeAll();
    this.remove();
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _syncHostAttrs(): void {
    if (this.block?.id) {
      this.dataset.blockId = this.block.id!;
    }
    this.style.textAlign = this.block?.attrs?.alignment ?? '';
  }

  // ─── Editing helpers (ported 1:1 from BaseBlock) ─────────────────────────

  /**
   * Creates a contenteditable element pre-filled with inline content.
   * Attaches standard keyboard handlers (Enter = split, Backspace-at-start = merge).
   */
  protected makeContentEditable(
    tag: string,
    inlineNodes: InlineNode[],
    extraClass = '',
  ): HTMLElement {
    const el = document.createElement(tag);
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');

    if (extraClass) el.className = extraClass;

    el.setAttribute('data-block-id', this.block.id!);
    InlineRenderer.render(el, inlineNodes);

    this.eventGroup.on(el, 'keydown', (e) => this.handleKeyDown(e));
    this.eventGroup.on(el, 'input', () => this.onInput(el));

    return el;
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Check for markdown shortcut before splitting into new block
      if (this.tryMarkdownShortcut(e.currentTarget as HTMLElement)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      this.handleEnter(e.currentTarget as HTMLElement);
    } else if (e.key === ' ' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // First check if we should exit formatting (double-space at end of formatted node)
      if (this.tryExitFormatting(e.currentTarget as HTMLElement)) {
        return;
      }
      // Then check for markdown shortcut conversion
      if (this.tryMarkdownShortcut(e.currentTarget as HTMLElement, true)) {
        e.preventDefault();
        return;
      }
    } else if (e.key === 'Backspace') {
      this.handleBackspace(e.currentTarget as HTMLElement, e);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.handleArrow(e);
    }
  }

  protected handleEnter(el: HTMLElement): void {
    const { before, after } = this.splitAtCaret(el);

    // Reflect the pre-caret content in the DOM before the model update so the
    // re-render resolves to exactly `before` (live content is authoritative).
    InlineRenderer.render(el, before);
    this.ctx.manager.update(this.block.id!, { content: before });

    const newBlock = this.ctx.manager.add('paragraph', {
      content: after,
      afterId: this.block.id!,
    });

    requestAnimationFrame(() => {
      const newEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id!}"] [contenteditable]`,
      ) as HTMLElement | null;
      if (newEl) {
        newEl.focus();
        const range = document.createRange();
        range.setStart(newEl, 0);
        range.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });
  }

  protected handleBackspace(el: HTMLElement, e: KeyboardEvent): void {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    if (range.startOffset !== 0) return;

    // Ensure we are at the very first text node
    let node: Node | null = range.startContainer;
    while (node && node !== el) {
      if (node.previousSibling) return;
      node = node.parentNode;
    }

    e.preventDefault();

    const allBlocks = this.ctx.manager.getAll();
    const idx = allBlocks.findIndex((b) => b.id! === this.block.id!);
    if (idx <= 0) return;

    const prevBlock = allBlocks[idx - 1];
    if (!prevBlock.content) {
      console.log('Previous block has no content, deleting current block', prevBlock, this.block);
      this.ctx.manager.delete(this.block.id!);
      return;
    }

    const currentNodes = InlineParser.parse(el);
    const mergedContent = [...(prevBlock.content ?? []), ...currentNodes];
    const mergeOffset = (prevBlock.content ?? []).reduce((s, n) => s + n.text.length, 0);

    // Reflect the merged content in the previous block's DOM before the model
    // update so the re-render (live content is authoritative) keeps it.
    const prevEl = this.ctx.editorEl.querySelector(
      `[data-block-id="${prevBlock.id!}"] [contenteditable]`,
    ) as HTMLElement | null;
    if (prevEl) {
      InlineRenderer.render(prevEl, mergedContent);
    }

    this.ctx.manager.update(prevBlock.id!, { content: mergedContent });
    this.ctx.manager.delete(this.block.id!);

    requestAnimationFrame(() => {
      if (prevEl) {
        prevEl.focus();
        this.setCaret(prevEl, mergeOffset);
      }
    });
  }

  protected handleArrow(e: KeyboardEvent): void {
    const allBlocks = this.ctx.manager.getAll();
    const idx = allBlocks.findIndex((b) => b.id! === this.block.id!);

    if (e.key === 'ArrowUp' && idx > 0) {
      const targetId = allBlocks[idx - 1].id!;
      const targetEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${targetId}"] [contenteditable]`,
      ) as HTMLElement | null;
      if (targetEl) {
        e.preventDefault();
        targetEl.focus();
      }
    } else if (e.key === 'ArrowDown' && idx < allBlocks.length - 1) {
      const targetId = allBlocks[idx + 1].id!;
      const targetEl = this.ctx.editorEl.querySelector(
        `[data-block-id="${targetId}"] [contenteditable]`,
      ) as HTMLElement | null;
      if (targetEl) {
        e.preventDefault();
        targetEl.focus();
      }
    }
  }

  /**
   * Check if the text before the cursor ends with a markdown shortcut pattern.
   * If so, replace only the affected nodes with formatted ones and return true.
   */
  protected tryMarkdownShortcut(el: HTMLElement, addTrailingSpace = false): boolean {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;

    const range = sel.getRangeAt(0);
    const preCaret = document.createRange();
    preCaret.setStart(el, 0);
    preCaret.setEnd(range.startContainer, range.startOffset);
    const cursorOffset = preCaret.toString().length;

    // Parse current DOM to get existing nodes (preserves formatting)
    const currentNodes = InlineParser.parse(el);
    if (currentNodes.length === 0) return false;

    // Find which node contains the cursor and character offset within that node
    let accumulated = 0;
    let targetNodeIndex = -1;
    let offsetInNode = 0;

    for (let i = 0; i < currentNodes.length; i++) {
      const node = currentNodes[i];
      const nextAccumulated = accumulated + node.text.length;
      if (cursorOffset <= nextAccumulated) {
        targetNodeIndex = i;
        offsetInNode = cursorOffset - accumulated;
        break;
      }
      accumulated = nextAccumulated;
    }

    if (targetNodeIndex === -1) return false;

    // Build nodes before cursor (including partial target node)
    const nodesBeforeCursor = currentNodes.slice(0, targetNodeIndex);
    const targetNode = currentNodes[targetNodeIndex];
    if (offsetInNode > 0) {
      nodesBeforeCursor.push({ ...targetNode, text: targetNode.text.slice(0, offsetInNode) });
    }

    const converted = MarkdownShortcuts.matchBeforeCursor(nodesBeforeCursor);
    if (!converted) return false;

    // When triggered by Space, append trailing space to the last formatted node
    // so the cursor stays inside the formatting (user can continue typing in bold)
    if (addTrailingSpace) {
      for (let i = converted.length - 1; i >= 0; i--) {
        const n = converted[i];
        if (Object.keys(PilaBlock.extractMarks(n)).length > 0 && !n.text.endsWith(' ')) {
          converted[i] = { ...n, text: n.text + ' ' };
          break;
        }
      }
    }

    // Build new nodes: converted (includes everything before cursor) + remainder of target node + rest
    const afterCursorInTarget = targetNode.text.slice(offsetInNode);
    const newNodes: InlineNode[] = [...converted];

    if (afterCursorInTarget) {
      const marks = PilaBlock.extractMarks(targetNode);
      if (Object.keys(marks).length > 0) {
        newNodes.push({ text: afterCursorInTarget, ...marks });
      } else {
        newNodes.push({ text: afterCursorInTarget });
      }
    }

    newNodes.push(...currentNodes.slice(targetNodeIndex + 1));

    InlineRenderer.render(el, newNodes);
    this.block = { ...this.block, content: newNodes };

    // Place caret at end of converted content
    const newOffset = converted.reduce((sum, n) => sum + n.text.length, 0);
    this.setCaret(el, newOffset);
    return true;
  }

  /** Extract formatting marks from an InlineNode. */
  private static extractMarks(node: InlineNode): Partial<InlineNode> {
    const marks: Partial<InlineNode> = {};
    if (node.bold) marks.bold = node.bold;
    if (node.italic) marks.italic = node.italic;
    if (node.code) marks.code = node.code;
    if (node.underline) marks.underline = node.underline;
    if (node.link) marks.link = node.link;
    return marks;
  }

  /**
   * Check if cursor is at the end of a formatted node (bold, italic, code, etc.)
   * If so, split the node to allow plain text after it (exit formatting mode).
   * Returns true if formatting was exited.
   */
  protected tryExitFormatting(el: HTMLElement): boolean {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;

    const range = sel.getRangeAt(0);
    const preCaret = document.createRange();
    preCaret.setStart(el, 0);
    preCaret.setEnd(range.startContainer, range.startOffset);
    const cursorOffset = preCaret.toString().length;

    // Parse current nodes
    const currentNodes = InlineParser.parse(el);
    if (currentNodes.length === 0) return false;

    // Find node containing cursor
    let accumulated = 0;
    let targetNodeIndex = -1;
    let offsetInNode = 0;

    for (let i = 0; i < currentNodes.length; i++) {
      const node = currentNodes[i];
      const nextAccumulated = accumulated + node.text.length;
      if (cursorOffset <= nextAccumulated) {
        targetNodeIndex = i;
        offsetInNode = cursorOffset - accumulated;
        break;
      }
      accumulated = nextAccumulated;
    }

    if (targetNodeIndex === -1) return false;

    const targetNode = currentNodes[targetNodeIndex];
    const marks = PilaBlock.extractMarks(targetNode);

    // Only exit if cursor is at the END of a formatted node
    if (Object.keys(marks).length === 0) return false;
    if (offsetInNode !== targetNode.text.length) return false;

    // Guard: if cursor is at offset 0 of a text node that is NOT inside
    // a formatting element, it's at a node boundary (e.g., inside a ZWSP
    // placed by a previous exit), not truly at the end of the formatted node.
    if (range.startOffset === 0) {
      let parent = range.startContainer.parentNode;
      let inFormatted = false;
      while (parent && parent !== el) {
        const tag = (parent as HTMLElement).tagName.toLowerCase();
        if (['strong', 'b', 'em', 'i', 'code', 'u', 'a'].includes(tag)) {
          inFormatted = true;
          break;
        }
        parent = parent.parentNode;
      }
      if (!inFormatted) return false;
    }

    // Build nodes: insert a ZWSP after the formatted node for cursor anchoring.
    // We don't prevent default, so the browser will insert the visible space
    // at the cursor position we set synchronously below.
    const newNodes: InlineNode[] = [];

    for (let i = 0; i < targetNodeIndex; i++) {
      newNodes.push({ ...currentNodes[i] });
    }

    newNodes.push({ ...targetNode });
    newNodes.push({ text: '' });

    for (let i = targetNodeIndex + 1; i < currentNodes.length; i++) {
      newNodes.push({ ...currentNodes[i] });
    }

    InlineRenderer.render(el, newNodes);
    this.block = { ...this.block, content: newNodes };

    // Place cursor synchronously at ZWSP start so the browser's default
    // space insertion (not prevented) puts a visible space before the ZWSP.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let zwspNode: Text | null = null;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.textContent === '') {
        zwspNode = node;
        break;
      }
    }
    if (zwspNode) {
      const newRange = document.createRange();
      newRange.setStart(zwspNode, 0);
      newRange.collapse(true);
      const newSel = window.getSelection();
      if (newSel) {
        newSel.removeAllRanges();
        newSel.addRange(newRange);
      }
    }
    return true;
  }

  /** Hook for subclasses — called on every `input` event of a managed element. */
  protected onInput(el: HTMLElement): void {
    // Keep instance-local content in sync so attribute-only updates can safely
    // flush fresh content without forcing manager updates on every keystroke.
    if (this.block.content !== undefined) {
      this.block = { ...this.block, content: InlineParser.parse(el) };
    }
    // Debounced manager flush — keeps the model in sync once typing pauses,
    // instead of pushing every keystroke through `blocks:change` → `renderAll()`.
    this.flushContent();
  }

  /** Split inline content at the current caret position. */
  protected splitAtCaret(el: HTMLElement): { before: InlineNode[]; after: InlineNode[] } {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return { before: InlineParser.parse(el), after: [] };

    const range = sel.getRangeAt(0);
    const fullText = el.textContent ?? '';

    const preCaret = document.createRange();
    preCaret.setStart(el, 0);
    preCaret.setEnd(range.startContainer, range.startOffset);
    const offset = preCaret.toString().length;

    const allNodes = InlineParser.parse(el);
    let cursor = 0;
    const before: InlineNode[] = [];
    const after: InlineNode[] = [];

    for (const node of allNodes) {
      const start = cursor;
      const end = cursor + node.text.length;
      if (end <= offset) {
        before.push(node);
      } else if (start >= offset) {
        after.push(node);
      } else {
        before.push({ ...node, text: node.text.slice(0, offset - start) });
        const afterText = node.text.slice(offset - start);
        if (afterText) after.push({ ...node, text: afterText });
      }
      cursor = end;
    }

    if (allNodes.length === 0) {
      before.push({ text: fullText.slice(0, offset) });
      const afterStr = fullText.slice(offset);
      if (afterStr) after.push({ text: afterStr });
    }

    return { before, after };
  }

  /** Save the current caret position as a character offset. */
  protected saveCaret(el: HTMLElement): number | null {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    const range = sel.getRangeAt(0);
    const preCaret = document.createRange();
    preCaret.setStart(el, 0);
    preCaret.setEnd(range.startContainer, range.startOffset);
    return preCaret.toString().length;
  }

  /** Restore caret to a previously saved character offset. */
  protected restoreCaret(el: HTMLElement, charOffset: number): void {
    this.setCaret(el, charOffset);
  }

  /** Place the caret at a character offset within a contenteditable element. */
  protected setCaret(el: HTMLElement, charOffset: number): void {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let remaining = charOffset;
    let textNode: Text | null = null;

    while (walker.nextNode()) {
      const n = walker.currentNode as Text;
      if (remaining <= n.length) {
        textNode = n;
        break;
      }
      remaining -= n.length;
    }

    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    if (textNode) {
      range.setStart(textNode, remaining);
    } else {
      range.setStart(el, el.childNodes.length);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
