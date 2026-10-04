import React from 'react';
import { Link } from 'react-router-dom';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HelpMarkdownProps {
  body: string;
  /** Article titles by lower-case title, so "See *Plans and limits*" links to that article. */
  articleIdsByTitle: Map<string, string>;
}

const isAppPath = (href: string) => href.startsWith('/') && !href.startsWith('//');
const isWebOrMail = (href: string) => /^(https?:|mailto:)/i.test(href);

/**
 * Renders help article Markdown. react-markdown never renders raw HTML, and
 * links are limited to app paths (opened in place) and web or mail links (new tab).
 */
export const HelpMarkdown: React.FC<HelpMarkdownProps> = ({ body, articleIdsByTitle }) => {
  const components: Components = {
    h2: ({ children }) => <h2 className="mb-2 mt-7 text-base font-bold text-gray-900 dark:text-white">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-5 text-sm font-bold text-gray-900 dark:text-white">{children}</h3>,
    p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
    code: ({ children }) => (
      <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[12.5px] dark:bg-white/10">{children}</code>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-border-dark">
        <table className="w-full text-left text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 font-semibold dark:border-border-dark dark:bg-white/[0.04]">{children}</th>
    ),
    td: ({ children }) => <td className="border-b border-gray-100 px-3 py-2 align-top dark:border-border-dark/60">{children}</td>,
    em: ({ children }) => {
      const id = typeof children === 'string' ? articleIdsByTitle.get(children.toLowerCase()) : undefined;
      return id ? (
        <Link to={`/help/${id}`} className="font-medium text-primary hover:underline">{children}</Link>
      ) : (
        <em>{children}</em>
      );
    },
    a: ({ href, children }) => {
      if (href && isAppPath(href)) return <Link to={href} className="text-primary hover:underline">{children}</Link>;
      if (href && isWebOrMail(href)) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>;
      }
      return <span>{children}</span>;
    },
  };

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>{body}</Markdown>
    </div>
  );
};
