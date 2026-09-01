import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders Strapi's default richtext (Markdown) output. `react-markdown`
 * builds a React element tree from the Markdown AST rather than injecting
 * raw HTML, so it never executes embedded scripts/markup by default — no
 * separate sanitizer dependency is needed for CMS-authored content.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
