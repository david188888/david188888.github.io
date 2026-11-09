import { renderMarkdownToHtml } from "@/lib/content/posts";

interface InsightBodyProps {
  body: string;
  /** Accessible name of the `↩` link that returns from a source to the text. */
  citationBackLabel?: string;
}

export function InsightBody({ body, citationBackLabel }: InsightBodyProps) {
  return (
    <div
      className="insight-body"
      dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(body, { citationBackLabel }) }}
    />
  );
}
