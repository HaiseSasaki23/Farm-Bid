import { useCountUp } from '../hooks/useCountUp';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Star, X } from 'lucide-react';
import { GRADE_INFO, cropLook, cropPhotoSources, peso } from '../lib/format';
import type { BidStatus, Grade, ListingStatus, SellerRating, TransactionStatus } from '../types';

export function GradeBadge({ grade }: { grade: Grade }) {
  return <span className={`grade g-${grade}`} title={`${GRADE_INFO[grade].label}: ${GRADE_INFO[grade].blurb}`}>Grade {grade}</span>;
}

export function SellerStars({ rating }: { rating: SellerRating }) {
  if (rating.average == null) return <span className="seller-rating new">New seller</span>;
  return (
    <span className="seller-rating" aria-label={`Seller rating ${rating.average} out of 5 from ${rating.count} ${rating.count === 1 ? 'sale' : 'sales'}`}>
      <Star size={14} fill="currentColor" /> {rating.average.toFixed(1)} <small>({rating.count})</small>
    </span>
  );
}
/* ---------- Stars (quality) ---------- */
export function Stars({ value, onChange, large }: { value: number; onChange?: (v: number) => void; large?: boolean }) {
  return (
    <span className={`stars ${large ? 'lg' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`Quality ${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star key={n} className={n <= value ? '' : 'off'} fill={n <= value ? 'currentColor' : 'none'} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} onClick={() => onChange(n)}>
            {icon}
          </button>
        ) : (
          icon
        );
      })}
    </span>
  );
}

/* ---------- Status badges ---------- */
type AnyStatus = BidStatus | ListingStatus | TransactionStatus;
const TONE: Record<string, string> = {
  Pending: 'amber', Accepted: 'green', Rejected: 'red', Cancelled: 'grey',
  Available: 'green', Reserved: 'blue', Sold: 'grey', Unavailable: 'red',
  Completed: 'green',
};
export function StatusBadge({ status }: { status: AnyStatus }) {
  return <span className={`badge ${TONE[status] ?? ''}`}>{status}</span>;
}

/* ---------- Crop picture or tile ---------- */
export function CropArt({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { emoji, bg } = cropLook(name);
  // The farmer's own photo first, then the shared photo in public/crops/, then the emoji tile.
  const sources = [...(src ? [src] : []), ...cropPhotoSources(name)];
  const [tried, setTried] = useState(0);
  useEffect(() => setTried(0), [name, src]);
  const current = sources[tried];
  return (
    <div className={`crop-art ${size}`} style={{ background: bg }}>
      {current ? <img src={current} alt={name} onError={() => setTried((n) => n + 1)} /> : <span className="emoji" aria-hidden="true">{emoji}</span>}
    </div>
  );
}

/* ---------- Price tag (signature element) ---------- */
export function PriceTag({ amount, unit, variant, large }: { amount: number; unit?: string; variant?: 'quiet' | 'top' | 'muted-tag'; large?: boolean }) {
  return (
    <span className={`tag num ${variant ?? ''} ${large ? 'lg' : ''}`}>
      {peso(amount)}
      {unit && <small>/{unit}</small>}
    </span>
  );
}

/* ---------- Page chrome ---------- */
export function PageHeader({ title, subtitle, actions, hero }: { title: string; subtitle?: string; actions?: ReactNode; hero?: boolean }) {
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className={`page-head${hero ? ' hero' : ''}`}>
      <div>
        {hero && <div className="eyebrow">{today}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function Loading({ variant = 'spinner' }: { variant?: 'spinner' | 'cards' | 'rows' | 'page' }) {
  if (variant === 'cards') {
    return (
      <div className="grid-3" role="status" aria-label="Loading">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="sk-card">
            <div className="skeleton sk-img" />
            <div className="skeleton sk-line w60" />
            <div className="skeleton sk-line w40" />
            <div className="skeleton sk-line w80" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'rows' || variant === 'page') {
    return (
      <div role="status" aria-label="Loading">
        {variant === 'page' && (
          <div className="sk-stats">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton sk-stat" />)}
          </div>
        )}
        <div className="card sk-rows">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="sk-row">
              <div className="skeleton sk-thumb" />
              <div className="sk-col">
                <div className="skeleton sk-line w40" />
                <div className="skeleton sk-line w60" />
              </div>
              <div className="skeleton sk-pill" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="loading" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="banner error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}

/* ---------- Illustrated empty states ---------- */
type Art = 'crate' | 'search' | 'bell';
function EmptyArt({ kind }: { kind: Art }) {
  return (
    <svg className="empty-art" width="170" height="112" viewBox="0 0 170 110" aria-hidden="true">
      <ellipse cx="85" cy="101" rx="62" ry="7" fill="currentColor" opacity="0.12" />
      {kind === 'bell' ? (
        <>
          <path d="M85 18c-20 0-32 15-32 34v14l-9 12h82l-9-12V52c0-19-12-34-32-34z" fill="#ffc800" />
          <path d="M85 18c-20 0-32 15-32 34v14l-9 12h41z" fill="#f0b400" opacity="0.5" />
          <circle cx="85" cy="92" r="8" fill="#d99a00" />
          <path d="M85 18v-6" stroke="#247a4a" strokeWidth="4" strokeLinecap="round" />
          <path d="M92 10c8-2 14 2 16 8-8 2-14-2-16-8z" fill="#2f9a5c" />
        </>
      ) : (
        <>
          <path d="M30 52h110l-9 44H39z" fill="#d9b26a" />
          <path d="M30 52h110l-3 14H33z" fill="#c59a4e" />
          <path d="M52 66v28M85 66v28M118 66v28" stroke="#b88a3d" strokeWidth="3" />
          <path d="M62 52c-6-16 6-26 14-22 2 10-4 18-14 22z" fill="#2f9a5c" />
          <path d="M88 52c-2-18 12-28 22-22-2 12-10 20-22 22z" fill="#247a4a" />
          <circle cx="118" cy="46" r="9" fill="#ffc800" />
          <path d="M118 38c1-5 4-7 7-8" stroke="#247a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
          {kind === 'search' && (
            <g>
              <circle cx="128" cy="70" r="18" fill="rgba(255,255,255,0.55)" stroke="#44554b" strokeWidth="5" />
              <path d="M141 83l16 16" stroke="#44554b" strokeWidth="7" strokeLinecap="round" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}

export function Empty({ title, children, action, art = 'crate' }: { icon?: ReactNode; title: string; children?: ReactNode; action?: { to: string; label: string }; art?: Art }) {
  return (
    <div className="empty">
      <EmptyArt kind={art} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && (
        <Link className="btn primary" to={action.to}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

/* ---------- Numbers that count up ---------- */
export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{format ? format(v) : Math.round(v).toLocaleString('en-PH')}</>;
}

const STAT_ART = {
  crate: (
    <svg viewBox="0 0 72 56" aria-hidden="true">
      <circle cx="24" cy="16" r="9" fill="#d9472b" /><circle cx="40" cy="14" r="8" fill="#e8622f" />
      <path d="M46 20c6-8 14-8 18-4-4 6-12 9-18 4z" fill="#3f9a5f" /><path d="M10 22c4-8 12-8 16-2-4 6-12 8-16 2z" fill="#58b06f" />
      <path d="M6 24h60l-5 28H11z" fill="#d9a35b" /><path d="M6 24h60l-1.2 7H7.2z" fill="#c48a43" />
      <path d="M14 38h44M15 45h42" stroke="#b07a35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  stall: (
    <svg viewBox="0 0 72 56" aria-hidden="true">
      <path d="M8 10h56l4 14H4z" fill="#f4f0e4" />
      <path d="M8 10h9l-2 14H4zM26 10h9l-1 14h-9zM44 10h9l1 14h-9z" fill="#e0572f" />
      <path d="M10 24v28M62 24v28" stroke="#a9753a" strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="38" width="52" height="14" rx="2" fill="#d9a35b" />
      <circle cx="24" cy="35" r="4.5" fill="#e0572f" /><circle cx="36" cy="34" r="4.5" fill="#f4b400" /><circle cx="48" cy="35" r="4.5" fill="#58b06f" />
    </svg>
  ),
  deal: (
    <svg viewBox="0 0 72 56" aria-hidden="true">
      <path d="M50 4l2 6M60 8l-3 5M64 18l-6 2" stroke="#f4b400" strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="12" width="40" height="38" rx="5" fill="#fff" stroke="#2d7a5e" strokeWidth="2.5" />
      <path d="M18 24h24M18 32h16" stroke="#b9d3c2" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="42" r="12" fill="#2d7a5e" /><path d="M38.5 42.5l4 4 7-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 72 56" aria-hidden="true">
      <g fill="#f4b400" stroke="#c98f00" strokeWidth="2">
        <ellipse cx="26" cy="46" rx="18" ry="6" /><path d="M8 40v6c0 3 8 6 18 6s18-3 18-6v-6" /><ellipse cx="26" cy="40" rx="18" ry="6" />
        <ellipse cx="26" cy="31" rx="18" ry="6" /><path d="M8 25v6c0 3 8 6 18 6s18-3 18-6v-6" /><ellipse cx="26" cy="25" rx="18" ry="6" />
        <ellipse cx="52" cy="38" rx="14" ry="5" /><path d="M38 32v6c0 3 6 5 14 5s14-2 14-5v-6" /><ellipse cx="52" cy="32" rx="14" ry="5" />
      </g>
      <path d="M54 22c0-8 6-12 12-12 0 8-5 12-12 12z" fill="#58b06f" />
    </svg>
  ),
};

export function Stat({ label, value, sub, icon, hot, format, art }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode; hot?: boolean; format?: (n: number) => string; art?: keyof typeof STAT_ART }) {
  return (
    <div className={`card stat ${hot ? 'hot' : ''}`}>
      {art && <div className="stat-art">{STAT_ART[art]}</div>}
      <div className="label"><span className="ico">{icon}</span>{label}</div>
      <div className="value num">{typeof value === 'number' ? <CountUp value={value} format={format} /> : value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer, narrow }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; narrow?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${narrow ? 'narrow' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({
  title, children, confirmLabel, danger, busy, onConfirm, onClose,
}: { title: string; children: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      title={title}
      narrow
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose} disabled={busy}>Keep as is</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" />} {confirmLabel}
          </button>
        </>
      }
    >
      <div className="stack muted">{children}</div>
    </Modal>
  );
}