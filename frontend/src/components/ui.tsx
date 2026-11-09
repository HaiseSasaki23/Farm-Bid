import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Star, X } from 'lucide-react';
import { cropLook, peso } from '../lib/format';
import type { BidStatus, ListingStatus, TransactionStatus } from '../types';

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
  return (
    <div className={`crop-art ${size}`} style={{ background: bg }}>
      {src ? <img src={src} alt={name} /> : <span className="emoji" aria-hidden="true">{emoji}</span>}
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
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function Loading() {
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

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: { to: string; label: string } }) {
  return (
    <div className="empty">
      <div className="ico">{icon}</div>
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

export function Stat({ label, value, sub, icon, hot }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode; hot?: boolean }) {
  return (
    <div className={`card stat ${hot ? 'hot' : ''}`}>
      <div className="label">{icon}{label}</div>
      <div className="value num">{value}</div>
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
