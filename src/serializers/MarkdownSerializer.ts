import { Block, InlineNode, TableRow } from '../types'

function inlineToMd(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      let text = node.text
      if (node.code) text = `\`${text}\``
      if (node.bold) text = `**${text}**`
      if (node.italic) text = `_${text}_`
      if (node.underline) text = `<u>${text}</u>`
      if (node.link) text = `[${text}](${node.link})`
      return text
    })
    .join('')
}

function tablesToMd(rows: TableRow[]): string {
  if (rows.length === 0) return ''
  const lines: string[] = []

  rows.forEach((row, idx) => {
    const cells = row.cells.map((c) => inlineToMd(c.content)).join(' | ')
    lines.push(`| ${cells} |`)
    if (idx === 0) {
      const sep = row.cells.map(() => '---').join(' | ')
      lines.push(`| ${sep} |`)
    }
  })

  return lines.join('\n')
}

export class MarkdownSerializer {
  static serialize(blocks: Block[]): string {
    return blocks
      .map((block) => MarkdownSerializer.blockToMd(block))
      .join('\n\n')
  }

  private static blockToMd(block: Block): string {
    const content = block.content ?? []

    switch (block.type) {
      case 'paragraph':
        return inlineToMd(content)
      case 'heading1':
        return `# ${inlineToMd(content)}`
      case 'heading2':
        return `## ${inlineToMd(content)}`
      case 'heading3':
        return `### ${inlineToMd(content)}`
      case 'bulletList':
        return `- ${inlineToMd(content)}`
      case 'numberedList':
        return `1. ${inlineToMd(content)}`
      case 'todo': {
        const check = block.attrs?.checked ? 'x' : ' '
        return `- [${check}] ${inlineToMd(content)}`
      }
      case 'code': {
        const lang = block.attrs?.language ?? ''
        const code = content.map((n) => n.text).join('')
        return `\`\`\`${lang}\n${code}\n\`\`\``
      }
      case 'quote':
        return `> ${inlineToMd(content)}`
      case 'callout': {
        const icon = block.attrs?.icon ?? '💡'
        return `> ${icon} ${inlineToMd(content)}`
      }
      case 'divider':
        return '---'
      case 'image': {
        const alt = block.attrs?.alt ?? ''
        const src = block.attrs?.src ?? ''
        return `![${alt}](${src})`
      }
      case 'table':
        return tablesToMd(block.attrs?.rows ?? [])
      case 'columns': {
        const defs = block.attrs?.columnDefs ?? []
        return defs
          .map((def) =>
            (def.blocks ?? [])
              .map((b) => MarkdownSerializer.blockToMd(b))
              .join('\n\n'),
          )
          .join('\n\n')
      }
      case 'button': {
        const label = inlineToMd(content)
        const href  = block.attrs?.href ?? '#'
        return `[${label}](${href})`
      }
      default:
        return ''
    }
  }
}
