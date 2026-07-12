import { describe, it, expect } from 'vitest';
import { MarkdownShortcuts } from './MarkdownShortcuts';

describe('MarkdownShortcuts', () => {
  describe('matchBeforeCursor', () => {
    it('returns null when no pattern found', () => {
      const nodes = [{ text: 'hello world' }];
      expect(MarkdownShortcuts.matchBeforeCursor(nodes)).toBeNull();
    });

    it('converts **bold**', () => {
      const nodes = [{ text: 'hello **bold**' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: 'hello ' },
        { text: 'bold', bold: true },
      ]);
    });

    it('converts *italic*', () => {
      const nodes = [{ text: '*italic*' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: 'italic', italic: true },
      ]);
    });

    it('converts `code`', () => {
      const nodes = [{ text: '`code`' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: 'code', code: true },
      ]);
    });

    it('converts ~underline~', () => {
      const nodes = [{ text: '~underline~' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: 'underline', underline: true },
      ]);
    });

    it('converts [text](url)', () => {
      const nodes = [{ text: '[here](https://example.com)' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: 'here', link: 'https://example.com' },
      ]);
    });

    it('preserves text before the pattern', () => {
      const nodes = [{ text: 'hello **world**' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: 'hello ' },
        { text: 'world', bold: true },
      ]);
    });

    it('does not match unmatched delimiters', () => {
      const nodes = [{ text: '** not closed' }];
      expect(MarkdownShortcuts.matchBeforeCursor(nodes)).toBeNull();
    });

    it('does not match empty content between delimiters', () => {
      const nodes = [{ text: '****' }];
      expect(MarkdownShortcuts.matchBeforeCursor(nodes)).toBeNull();
    });

    it('does not match * inside a word', () => {
      const nodes = [{ text: 'foo*bar*' }];
      expect(MarkdownShortcuts.matchBeforeCursor(nodes)).toBeNull();
    });

    it('prefers the pattern closest to the cursor', () => {
      const nodes = [{ text: '**bold** *italic*' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      // Should match italic (last pattern), not bold
      expect(result).toEqual([
        { text: '**bold** ' },
        { text: 'italic', italic: true },
      ]);
    });

    it('handles multiple of the same pattern, picks the last', () => {
      const nodes = [{ text: '**a** **b**' }];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      expect(result).toEqual([
        { text: '**a** ' },
        { text: 'b', bold: true },
      ]);
    });

    it('preserves existing formatting in nodes before the pattern', () => {
      // Simulate: "hello " (plain) + "world" (bold) + " *italic*" -> full text: "hello world *italic*"
      // The space before *italic* should be plain text, not part of the markdown
      const nodes = [
        { text: 'hello ' },
        { text: 'world', bold: true },
        { text: ' *italic*' },
      ];
      const result = MarkdownShortcuts.matchBeforeCursor(nodes);
      // Should preserve bold on "world", keep space plain, convert *italic* to italic
      expect(result).toEqual([
        { text: 'hello ' },
        { text: 'world', bold: true },
        { text: ' ' },  // space before * is plain
        { text: 'italic', italic: true },
      ]);
    });
  });
});