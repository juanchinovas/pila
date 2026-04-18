import { InlineNode } from '../types'

/**
 * Renders an array of InlineNodes into DOM nodes inside an element.
 */
export class InlineRenderer {
  static render(container: HTMLElement, nodes: InlineNode[]): void {
    container.innerHTML = ''
    if (nodes.length === 0) return

    for (const node of nodes) {
      container.appendChild(InlineRenderer.nodeToDOM(node))
    }
  }

  private static nodeToDOM(node: InlineNode): Node {
    let el: Node = document.createTextNode(node.text)

    if (node.code) {
      const code = document.createElement('code')
      code.appendChild(el)
      el = code
    }
    if (node.bold) {
      const strong = document.createElement('strong')
      strong.appendChild(el)
      el = strong
    }
    if (node.italic) {
      const em = document.createElement('em')
      em.appendChild(el)
      el = em
    }
    if (node.underline) {
      const u = document.createElement('u')
      u.appendChild(el)
      el = u
    }
    if (node.link) {
      const a = document.createElement('a')
      a.href = node.link
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.appendChild(el)
      el = a
    }

    return el
  }
}
