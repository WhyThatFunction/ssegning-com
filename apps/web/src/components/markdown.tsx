import type { ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MermaidDiagram } from './mermaid-diagram';

type CodeElement = ReactElement<{ className?: string; children?: ReactNode }>;

function isMermaidBlock(child: ReactNode): child is CodeElement {
  if (child == null || typeof child !== 'object' || !('props' in child)) return false;
  const className = (child as CodeElement).props.className ?? '';
  return /(?:^|\s)language-mermaid(?:\s|$)/.test(className);
}

function codeText(node: ReactNode): string {
  return String(node ?? '').replace(/\n$/, '');
}

/**
 * Renders Strapi's default richtext (Markdown) output. `react-markdown`
 * builds a React element tree from the Markdown AST rather than injecting
 * raw HTML, so it never executes embedded scripts/markup by default — no
 * separate sanitizer dependency is needed for CMS-authored content.
 *
 * Fenced ```mermaid blocks are rendered as real diagrams instead of a code
 * block — see `mermaid-diagram.tsx`. Detection happens on `pre` rather than
 * `code`: a `code` override still gets wrapped in `<pre>` by its parent, so
 * `pre` is the level that can swap in a diagram instead of a code block.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children: preChildren }) {
            const child = Array.isArray(preChildren) ? preChildren[0] : preChildren;
            if (isMermaidBlock(child)) {
              return <MermaidDiagram chart={codeText(child.props.children)} />;
            }
            return <pre>{preChildren}</pre>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
