import { Block } from '../types';
import { PilaBlock } from './PilaBlock';

export class DividerBlock extends PilaBlock {
  private wrapper!: HTMLDivElement;

  protected buildDOM(): void {
    this.classList.add('pila-divider');

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'pila-divider-wrapper';
    this.wrapper.setAttribute('tabindex', '0');
    this.wrapper.setAttribute('role', 'separator');

    const line = document.createElement('div');
    line.className = 'pila-divider-line';

    this.wrapper.append(line);

    this.eventGroup.on(this.wrapper, 'focus', () => {
      this.wrapper.classList.add('pila-divider-wrapper--focused');
    });
    this.eventGroup.on(this.wrapper, 'blur', () => {
      this.wrapper.classList.remove('pila-divider-wrapper--focused');
    });

    this.eventGroup.on(this.wrapper, 'keydown', (e: KeyboardEvent) => {
      this.handleArrow(e);
      if (e.key === 'Enter') {
        e.preventDefault();
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id! });
        requestAnimationFrame(() => {
          const el = this.ctx.editorEl.querySelector(
            `[data-block-id="${newBlock.id!}"] [contenteditable]`
          ) as HTMLElement | null;
          el?.focus();
        });
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.ctx.manager.delete(this.block.id!);
      }
    });

    this.appendChild(this.wrapper);
  }

  getContent(): Block {
    return { ...this.block };
  }

  focusBlock(): void {
    this.wrapper.focus();
  }
}

if (!customElements.get('pila-divider')) {
  customElements.define('pila-divider', DividerBlock);
}
