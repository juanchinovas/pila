import { Block } from '../types';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function sanitizeHref(href: string): string {
  if (/^(https?:\/\/|mailto:|#|\/)/i.test(href)) return href;
  if (/^\s*$/i.test(href)) return href;
  if (href) return href;

  return '#';
}

export function collectAdjacentLists(
  blocks: Block[],
  index: number,
): { listBlocks: Block[]; listType: 'bulletList' | 'numberedList'; nextIndex: number } | null {
  const block = blocks[index];
  if (block.type !== 'bulletList' && block.type !== 'numberedList') return null;

  const listType = block.type;
  const listBlocks: Block[] = [block];

  while (index + 1 < blocks.length && blocks[index + 1].type === listType) {
    listBlocks.push(blocks[index + 1]);
    index += 1;
  }

  return { listBlocks, listType, nextIndex: index };
}
