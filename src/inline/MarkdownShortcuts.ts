import { InlineNode } from '../types';

interface Pattern {
  open: string
  close: string
  mark: Omit<InlineNode, 'text'>
}

const PATTERNS: Pattern[] = [
  { open: '[', close: ']', mark: {} },        // link — special handling
  { open: '**', close: '**', mark: { bold: true } },
  { open: '`', close: '`', mark: { code: true } },
  { open: '~', close: '~', mark: { underline: true } },
  { open: '*', close: '*', mark: { italic: true } },
];

export class MarkdownShortcuts {
  /**
   * Given the InlineNodes before the cursor, checks if the text ends with
   * a complete markdown pattern. Returns new nodes replacing only the matched
   * pattern with formatted version, preserving existing formatting of other nodes.
   */
  static matchBeforeCursor(nodesBefore: InlineNode[]): InlineNode[] | null {
    // Build concatenated text and track which node each character comes from
    const { text, charToNodeIndex, charToNodeOffset } = MarkdownShortcuts.buildTextMap(nodesBefore);
    if (!text) return null;

    let bestResult: { nodes: InlineNode[]; end: number } | null = null;

    for (const pattern of PATTERNS) {
      const result = MarkdownShortcuts.tryPatternOnNodes(text, charToNodeIndex, charToNodeOffset, nodesBefore, pattern);
      if (result && (!bestResult || result.end > bestResult.end)) {
        bestResult = result;
      }
    }

    return bestResult?.nodes ?? null;
  }

  private static buildTextMap(nodes: InlineNode[]): {
    text: string
    charToNodeIndex: number[]
    charToNodeOffset: number[]
  } {
    let text = '';
    const charToNodeIndex: number[] = [];
    const charToNodeOffset: number[] = [];

    nodes.forEach((node, nodeIndex) => {
      for (let i = 0; i < node.text.length; i++) {
        text += node.text[i];
        charToNodeIndex.push(nodeIndex);
        charToNodeOffset.push(i);
      }
    });

    return { text, charToNodeIndex, charToNodeOffset };
  }

  private static tryPatternOnNodes(
    text: string,
    charToNodeIndex: number[],
    charToNodeOffset: number[],
    originalNodes: InlineNode[],
    pattern: Pattern
  ): { nodes: InlineNode[]; end: number } | null {
    if (pattern.open === '[') return MarkdownShortcuts.tryLinkOnNodes(text, charToNodeIndex, charToNodeOffset, originalNodes);

    const { open, close, mark } = pattern;

    // Find the last occurrence of the closing delimiter
    const lastClose = text.lastIndexOf(close);
    if (lastClose === -1) return null;

    // Find the opening delimiter before the closing one
    const lastOpen = text.lastIndexOf(open, lastClose - 1);
    if (lastOpen === -1) return null;

    // For single-char delimiters, ensure opening isn't preceded by a word char
    if (open.length === 1 && lastOpen > 0 && /\w/.test(text[lastOpen - 1])) return null;

    const innerStart = lastOpen + open.length;
    const innerEnd = lastClose;
    if (innerStart >= innerEnd) return null;

    // The full pattern spans from lastOpen to lastClose + close.length - 1
    const patternEnd = lastClose + close.length;

    // Build result nodes:
    // 1. Nodes before the pattern (preserving their formatting)
    // 2. The matched pattern with formatting applied
    const startNodeIdx = charToNodeIndex[lastOpen];
    const startNodeOffset = charToNodeOffset[lastOpen];
    const endNodeIdx = charToNodeIndex[patternEnd - 1];
    const endNodeOffset = charToNodeOffset[patternEnd - 1] + 1; // exclusive

    const resultNodes: InlineNode[] = [];

    // Add nodes before the start node
    for (let i = 0; i < startNodeIdx; i++) {
      resultNodes.push({ ...originalNodes[i] });
    }

    // Add prefix of start node (before the opening delimiter)
    if (startNodeOffset > 0) {
      const prefix = originalNodes[startNodeIdx].text.slice(0, startNodeOffset);
      resultNodes.push({ ...originalNodes[startNodeIdx], text: prefix });
    }

    // Add the formatted inner text
    const innerText = text.slice(innerStart, innerEnd);
    if (innerText) {
      resultNodes.push({ text: innerText, ...mark });
    }

    // Add suffix of end node (after the closing delimiter)
    if (endNodeOffset < originalNodes[endNodeIdx].text.length) {
      const suffix = originalNodes[endNodeIdx].text.slice(endNodeOffset);
      resultNodes.push({ ...originalNodes[endNodeIdx], text: suffix });
    }

    // Add remaining nodes after end node
    for (let i = endNodeIdx + 1; i < originalNodes.length; i++) {
      resultNodes.push({ ...originalNodes[i] });
    }

    return { nodes: resultNodes, end: patternEnd };
  }

  private static tryLinkOnNodes(
    text: string,
    charToNodeIndex: number[],
    charToNodeOffset: number[],
    originalNodes: InlineNode[]
  ): { nodes: InlineNode[]; end: number } | null {
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;
    let best: { nodes: InlineNode[]; end: number } | null = null;
    let searchFrom = 0;

    while (searchFrom < text.length) {
      const sub = text.slice(searchFrom);
      const m = sub.match(linkRe);
      if (!m) break;

      const matchStart = searchFrom + m.index!;
      const matchEnd = searchFrom + m.index! + m[0].length;

      const startNodeIdx = charToNodeIndex[matchStart];
      const startNodeOffset = charToNodeOffset[matchStart];
      const endNodeIdx = charToNodeIndex[matchEnd - 1];
      const endNodeOffset = charToNodeOffset[matchEnd - 1] + 1;

      const resultNodes: InlineNode[] = [];

      // Nodes before link
      for (let i = 0; i < startNodeIdx; i++) {
        resultNodes.push({ ...originalNodes[i] });
      }

      // Prefix of start node
      if (startNodeOffset > 0) {
        const prefix = originalNodes[startNodeIdx].text.slice(0, startNodeOffset);
        resultNodes.push({ ...originalNodes[startNodeIdx], text: prefix });
      }

      // The link
      resultNodes.push({ text: m[1], link: m[2] });

      // Suffix of end node
      if (endNodeOffset < originalNodes[endNodeIdx].text.length) {
        const suffix = originalNodes[endNodeIdx].text.slice(endNodeOffset);
        resultNodes.push({ ...originalNodes[endNodeIdx], text: suffix });
      }

      // Remaining nodes
      for (let i = endNodeIdx + 1; i < originalNodes.length; i++) {
        resultNodes.push({ ...originalNodes[i] });
      }

      best = { nodes: resultNodes, end: matchEnd };
      searchFrom = matchEnd;
    }

    return best;
  }
}