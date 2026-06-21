import Link from "next/link";

export interface AcademicRecordCardProps {
  category: string;
  meta: string;
  title: string;
  description: string;
  details?: readonly string[];
  href?: string;
  linkLabel?: string;
  external?: boolean;
  emphasis?: "default" | "research";
}

export function AcademicRecordCard({
  category,
  meta,
  title,
  description,
  details = [],
  href,
  linkLabel,
  external = false,
  emphasis = "default",
}: AcademicRecordCardProps) {
  return (
    <article className={`academic-card academic-card--${emphasis}`}>
      <div className="academic-card-meta">
        <span>{category}</span>
        <time>{meta}</time>
      </div>
      <div className="academic-card-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        {details.length > 0 || (href && linkLabel) ? (
          <div className="academic-card-details">
            {href && linkLabel ? (
              external ? (
                <a
                  className="academic-card-link"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {linkLabel}
                </a>
              ) : (
                <Link className="academic-card-link" href={href}>
                  {linkLabel}
                </Link>
              )
            ) : null}
            {details.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
