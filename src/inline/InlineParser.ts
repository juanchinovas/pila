import { InlineNode } from '../types'

/**
 * Walks a contenteditable element's DOM and extracts an array of InlineNodes.
 */
export class InlineParser {
  static parse(el: HTMLElement): InlineNode[] {
    const nodes: InlineNode[] = []
    InlineParser.walkNode(el, {}, nodes)
    return nodes
  }

  private static walkNode(
    node: Node,
    marks: Partial<InlineNode>,
    out: InlineNode[]
  ): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        out.push({ text, ...marks })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const childMarks = { ...marks }

    switch (tag) {
      case 'strong':
      case 'b':
        childMarks.bold = true
        break
      case 'em':
      case 'i':
        childMarks.italic = true
        break
      case 'code':
        childMarks.code = true
        break
      case 'u':
        childMarks.underline = true
        break
      case 'a':
        childMarks.link = (el as HTMLAnchorElement).getAttribute('href') || undefined
        break
      case 'br':
        out.push({ text: '\n', ...marks })
        return
    }

    for (const child of Array.from(node.childNodes)) {
      InlineParser.walkNode(child, childMarks, out)
    }
  }
}
