import { Block, InlineNode, TableRow } from '../types';
import { collectAdjacentLists } from './utils';

function inlineToMd(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      let text = node.text;
      if (node.code) text = `\`${text}\``;
      if (node.bold) text = `**${text}**`;
      if (node.italic) text = `_${text}_`;
      if (node.underline) text = `<u>${text}</u>`;
      if (node.link) text = `[${text}](${node.link})`;
      return text;
    })
    .join('');
}

function tablesToMd(rows: TableRow[]): string {
  if (rows.length === 0) return '';
  const lines: string[] = [];

  rows.forEach((row, idx) => {
    const cells = row.cells.map((c) => inlineToMd(c.content)).join(' | ');
    lines.push(`| ${cells} |`);
    if (idx === 0) {
      const sep = row.cells.map(() => '---').join(' | ');
      lines.push(`| ${sep} |`);
    }
  });

  return lines.join('\n');
}

export class MarkdownSerializer {
  static serialize(blocks: Block[]): string {
    const lines: string[] = [];

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];

      const collected = collectAdjacentLists(blocks, index);
      if (collected) {
        lines.push(MarkdownSerializer.listToMd(collected.listBlocks, collected.listType));
        index = collected.nextIndex;
        continue;
      }

      lines.push(MarkdownSerializer.blockToMd(block));
    }

    return lines.join('\n\n');
  }

  private static listToMd(blocks: Block[], type: 'bulletList' | 'numberedList'): string {
    const prefix = type === 'bulletList' ? '-' : '1.';
    return blocks
      .map((block) => `${prefix} ${inlineToMd(block.content ?? [])}`)
      .join('\n');
  }

  private static blockToMd(block: Block): string {
    const content = block.content ?? [];

    switch (block.type) {
      case 'paragraph':
        return inlineToMd(content);
      case 'heading1':
        return `# ${inlineToMd(content)}`;
      case 'heading2':
        return `## ${inlineToMd(content)}`;
      case 'heading3':
        return `### ${inlineToMd(content)}`;
      case 'bulletList':
        return `- ${inlineToMd(content)}`;
      case 'numberedList':
        return `1. ${inlineToMd(content)}`;
      case 'todo': {
        const check = block.attrs?.checked ? 'x' : ' ';
        return `- [${check}] ${inlineToMd(content)}`;
      }
      case 'code': {
        const rawLang = block.attrs?.language ?? '';
        // Normalize Prism's 'markup' to 'html' for better Markdown fence compatibility
        const lang = rawLang === 'markup' ? 'html' : rawLang;
        const code = content.map((n) => n.text).join('');
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      }
      case 'quote':
        return `> ${inlineToMd(content)}`;
      case 'callout': {
        const icon = block.attrs?.icon ?? '💡';
        return `> ${icon} ${inlineToMd(content)}`;
      }
      case 'divider':
        return '---';
      case 'image': {
        const alt = block.attrs?.alt ?? '';
        const src = block.attrs?.src ?? '';
        return `![${alt}](${src})`;
      }
      case 'table':
        return tablesToMd(block.attrs?.rows ?? []);
      case 'columns': {
        const defs = block.attrs?.columnDefs ?? [];
        return defs
          .map((def) =>
            (def.blocks ?? [])
              .map((b) => MarkdownSerializer.blockToMd(b))
              .join('\n\n'),
          )
          .join('\n\n');
      }
      case 'row': {
        const rowBlocks = block.attrs?.rowBlocks ?? [];
        return rowBlocks
          .map((b) => MarkdownSerializer.blockToMd(b))
          .join('\n\n');
      }
      case 'button': {
        const label = inlineToMd(content);
        const href  = block.attrs?.href ?? '#';
        return `[${label}](${href})`;
      }
      default:
        return '';
    }
  }
}
