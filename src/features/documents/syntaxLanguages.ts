import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import scss from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

/**
 * Registers a curated set of common languages instead of importing
 * react-syntax-highlighter's full language bundle (hundreds of grammars) —
 * keeps the preview feature's bundle cost reasonable. An unregistered
 * language just renders as plain text instead of throwing.
 */
let registered = false;
export function ensureSyntaxLanguagesRegistered() {
  if (registered) return;
  registered = true;

  SyntaxHighlighter.registerLanguage('bash', bash);
  SyntaxHighlighter.registerLanguage('c', c);
  SyntaxHighlighter.registerLanguage('cpp', cpp);
  SyntaxHighlighter.registerLanguage('css', css);
  SyntaxHighlighter.registerLanguage('go', go);
  SyntaxHighlighter.registerLanguage('java', java);
  SyntaxHighlighter.registerLanguage('javascript', javascript);
  SyntaxHighlighter.registerLanguage('json', json);
  SyntaxHighlighter.registerLanguage('jsx', jsx);
  SyntaxHighlighter.registerLanguage('markdown', markdown);
  SyntaxHighlighter.registerLanguage('markup', markup);
  SyntaxHighlighter.registerLanguage('php', php);
  SyntaxHighlighter.registerLanguage('python', python);
  SyntaxHighlighter.registerLanguage('ruby', ruby);
  SyntaxHighlighter.registerLanguage('rust', rust);
  SyntaxHighlighter.registerLanguage('scss', scss);
  SyntaxHighlighter.registerLanguage('sql', sql);
  SyntaxHighlighter.registerLanguage('tsx', tsx);
  SyntaxHighlighter.registerLanguage('typescript', typescript);
  SyntaxHighlighter.registerLanguage('yaml', yaml);
}

export { SyntaxHighlighter };
