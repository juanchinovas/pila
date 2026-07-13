import Prism from 'prismjs';

import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markdown';

export { Prism };

export const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  yml: 'yaml',
};

export const SUPPORTED_LANGUAGES = [
  'plaintext', 'bash', 'css', 'csharp', 'html', 'java', 'javascript',
  'json', 'jsx', 'markdown', 'markup', 'python', 'sql',
  'tsx', 'typescript', 'xml', 'yaml',
];

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightCode(code: string, lang: string): string {
  const resolvedKey = LANG_ALIASES[lang] ?? lang;
  if (resolvedKey === 'plaintext' || !Prism.languages[resolvedKey]) {
    return escapeHtml(code);
  }
  return Prism.highlight(code, Prism.languages[resolvedKey], resolvedKey);
}
