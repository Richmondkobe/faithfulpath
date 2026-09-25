import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// The course's prose. Everything about how it looks is in tbym.css under
// `.prose`, so this sets no colours of its own — the page is themed with
// tokens, and a literal colour here would be the one thing that did not change
// when the theme did.

const components: Components = {
  // The lesson files carry no H1 or H2 inside a section; if one ever appears it
  // renders as ordinary emphasis rather than competing with the page's own
  // heading hierarchy.
  h1: ({ children }) => <p className="font-semibold">{children}</p>,
  h2: ({ children }) => <p className="font-semibold">{children}</p>,
  h3: ({ children }) => <p className="font-semibold">{children}</p>,
};

export default function TbymMarkdown({ source }: { source: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
