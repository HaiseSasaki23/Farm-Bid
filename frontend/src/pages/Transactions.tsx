import { useState } from 'react';
import { CalendarDays, Check, Package, Receipt, Star, X } from 'lucide-react';
import { transactionService } from '../api';
import { useQuery } from '../hooks/useQuery';
import { useToast } from '../context/ToastContext';
import { dateShort, num, peso } from '../lib/format';
import type { Role, TransactionView } from '../types';
import { RatingModal } from '../components/RatingModal';
import { Confirm, CropArt, Empty, ErrorBanner, Loading, PageHeader, PriceTag, Stars, Stat, StatusBadge } from '../components/ui';

export function Transactions({ role }: { role: Role }) {
  const toast = useToast();
  const { data, loading, error } = useQuery(() => transactionService.mine(), []);
  const [target, setTarget] = useState<{ tx: TransactionView; action: 'complete' | 'cancel' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState<TransactionView | null>(null);
  const farmer = role === 'Farmer';

  const run = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await (target.action === 'complete' ? transactionService.complete(target.tx.transactionId) : transactionService.cancel(target.tx.transactionId));
      toast(target.action === 'complete' ? 'Sale completed.' : 'Transaction cancelled. The listing is open for bids again.');
      setTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update the transaction.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const done = data?.filter((t) => t.status === 'Completed') ?? [];
  const pending = data?.filter((t) => t.status === 'Pending') ?? [];
  const total = done.reduce((s, t) => s + t.totalAmount, 0);

  return (
    <>
      <PageHeader
        title={farmer ? 'Sales' : 'Purchases'}
        subtitle={farmer ? 'Every accepted bid becomes a transaction. Mark it complete once the buyer has paid and collected.' : 'Your accepted bids. The farmer marks each one complete after hand-over.'}
      />
      {error && <ErrorBanner message={error} />}
      {loading && !data ? (
        <Loading variant="rows" />
      ) : (
        <div className="stack-lg">
          <div className="grid-3">
            <Stat hot label={farmer ? 'Total sales' : 'Total spent'} value={total} format={peso} sub={`${done.length} completed`} />
            <Stat label="Waiting to complete" value={pending.length} sub={pending.length ? peso(pending.reduce((s, t) => s + t.totalAmount, 0)) : 'Nothing pending'} />
            <Stat label="All transactions" value={data?.length ?? 0} />
          </div>

          {!data || data.length === 0 ? (
            <div className="card">
              <Empty icon={<Receipt size={24} />} title="No transactions yet" action={farmer ? { to: '/farmer/listings', label: 'Review your listings' } : { to: '/buyer/browse', label: 'Browse harvests' }}>
                {farmer ? 'When you accept a bid, the sale appears here.' : 'When a farmer accepts your bid, the purchase appears here.'}
              </Empty>
            </div>
          ) : (
            <div className="deal-grid">
              {data.map((t) => (
                <article key={t.transactionId} className="card deal">
                  <div className="deal-media">
                    <CropArt name={t.listing?.cropName ?? ''} src={t.listing?.imagePath} size="md" />
                    <span className="deal-status"><StatusBadge status={t.status} /></span>
                  </div>
                  <div className="deal-body">
                    <div className="deal-top">
                      <div>
                        <h3>{t.listing?.cropName ?? 'Removed listing'}</h3>
                        <div className="small muted">{farmer ? `To ${t.buyer.fullName}` : `From ${t.farmer.farmName ?? t.farmer.fullName}`}</div>
                      </div>
                      <div className="deal-total num">{peso(t.totalAmount)}</div>
                    </div>
                    <div className="deal-meta">
                      <span className="num"><Package size={14} /> {num(t.quantity)} {t.listing?.unit}</span>
                      <PriceTag amount={t.agreedPrice} unit={t.listing?.unit} variant="quiet" />
                      <span><CalendarDays size={14} /> {dateShort(t.transactionDate)}</span>
                    </div>
                    <div className="deal-foot">
                      {t.rating ? (
                        <div title={t.rating.comment || undefined}>
                          <Stars value={t.rating.stars} />
                          {t.rating.comment && <div className="small faint rating-comment">“{t.rating.comment}”</div>}
                        </div>
                      ) : !farmer && t.status === 'Completed' ? (
                        <button className="btn secondary sm" onClick={() => setRating(t)}><Star size={15} /> Rate farmer</button>
                      ) : t.status === 'Completed' ? (
                        <span className="faint small">Not rated yet</span>
                      ) : <span />}
                      {farmer && t.status === 'Pending' && (
                        <div className="cell-actions">
                          <button className="btn primary sm" onClick={() => setTarget({ tx: t, action: 'complete' })}><Check size={16} /> Complete</button>
                          <button className="btn danger sm" onClick={() => setTarget({ tx: t, action: 'cancel' })}><X size={16} /> Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {rating && <RatingModal tx={rating} onClose={() => setRating(null)} />}

      {target && (
        <Confirm
          title={target.action === 'complete' ? 'Complete this sale?' : 'Cancel this transaction?'}
          confirmLabel={target.action === 'complete' ? 'Complete sale' : 'Cancel transaction'}
          danger={target.action === 'cancel'}
          busy={busy}
          onConfirm={run}
          onClose={() => setTarget(null)}
        >
          {target.action === 'complete' ? (
            <p>{target.tx.listing?.cropName} will be marked Sold, and {target.tx.buyer.fullName} will be notified.</p>
          ) : (
            <p>The listing opens for bids again, and {target.tx.buyer.fullName} will be notified. The bids you rejected earlier stay rejected.</p>
          )}
          <p className="strong num">{num(target.tx.quantity)} {target.tx.listing?.unit} · {peso(target.tx.totalAmount)}</p>
        </Confirm>
      )}
    </>
  );
}