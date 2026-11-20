import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export type JumpItem = { id: string; label: string };

/** Sticky pill bar: tap to glide to a section, and it follows you as you scroll. */
export function JumpBar({ items }: { items: JumpItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const go = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="jump" aria-label="Jump to a section">
      {items.map((i) => (
        <button key={i.id} type="button" className={active === i.id ? 'on' : ''} onClick={() => go(i.id)}>{i.label}</button>
      ))}
    </nav>
  );
}

/** Heading row for one section of the home feed. */
export function FeedHead({ title, hint, to, link = 'See all' }: { title: string; hint?: string; to?: string; link?: string }) {
  return (
    <div className="feed-head">
      <div>
        <h2>{title}</h2>
        {hint && <p className="muted small">{hint}</p>}
      </div>
      {to && <Link to={to} className="small strong row" style={{ gap: 4 }}>{link} <ArrowRight size={14} /></Link>}
    </div>
  );
}