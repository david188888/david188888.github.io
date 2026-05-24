interface TimelineCardProps {
  time: string;
  title: string;
  meta?: string;
  description: string;
}

export function TimelineCard({ time, title, meta, description }: TimelineCardProps) {
  return (
    <article
      className="border border-[rgba(166,182,206,0.08)] rounded-[0.85rem] p-4 backdrop-blur-[8px] shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(166,182,206,0.22)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.28),0_0_20px_rgba(100,120,160,0.08)]"
      style={{ background: "rgba(10,15,24,0.42)" }}
    >
      <p className="m-0 text-[0.74rem] tracking-[0.05em] uppercase text-[rgba(167,180,201,0.88)]">
        {time}
      </p>
      <h3 className="text-[#e8edf5] text-base leading-snug mt-1 mb-0">{title}</h3>
      {meta && (
        <p className="text-[rgba(162,173,191,0.86)] text-[0.92rem] mt-1 mb-0">{meta}</p>
      )}
      <p className="text-[rgba(198,208,224,0.9)] text-[0.92rem] mt-2 mb-0">{description}</p>
    </article>
  );
}
