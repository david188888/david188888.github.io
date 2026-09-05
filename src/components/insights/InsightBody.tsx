import { renderMarkdownToHtml } from "@/lib/content/posts";

interface InsightBodyProps {
  body: string;
}

export function InsightBody({ body }: InsightBodyProps) {
  return (
    <div
      className="insight-body"
      dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(body) }}
    />
  );
}
