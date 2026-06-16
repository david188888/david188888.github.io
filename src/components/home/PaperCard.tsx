interface PaperCardProps {
  venue: string;
  title: string;
  description: string;
  paperUrl: string;
  paperLabel: string;
}

export function PaperCard({
  venue,
  title,
  description,
  paperUrl,
  paperLabel,
}: PaperCardProps) {
  return (
    <article
      className="home-support-card border border-[rgba(166,182,206,0.08)] p-4 backdrop-blur-[8px] shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(166,182,206,0.22)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.24),0_0_20px_rgba(100,120,160,0.08)]"
      style={{ background: "rgba(10,15,24,0.42)" }}
    >
      <p className="m-0 text-[0.74rem] tracking-[0.05em] uppercase text-[rgba(167,180,201,0.88)]">
        {venue}
      </p>
      <h3 className="text-[#e8edf5] text-base leading-snug mt-1 mb-0">{title}</h3>
      <p className="text-[rgba(198,208,224,0.9)] text-[0.92rem] mt-2 mb-0">{description}</p>
      <p className="mt-2.5 text-[0.86rem] text-[rgba(186,199,220,0.92)]">
        <a
          href={paperUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit underline underline-offset-2"
        >
          {paperLabel}
        </a>
      </p>
    </article>
  );
}
