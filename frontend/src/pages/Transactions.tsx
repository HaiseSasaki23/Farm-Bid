import { useState } from 'react';
import { Check, Receipt, X } from 'lucide-react';
import { transactionService } from '../api';
import { useQuery } from '../hooks/useQuery';
import { useToast } from '../context/ToastContext';
import { dateShort, num, peso } from '../lib/format';
import type { Role, TransactionView } from '../types';
import { Confirm, CropArt, Empty, ErrorBanner, Loading, PageHeader, PriceTag, Stat, StatusBadge } from '../components/ui';

export function Transactions({ role }: { role: Role }) {
  const toast = useToast();
  const { data, loading, error } = useQuery(() => transactionService.mine(), []);
  const [target, setTarget] = useState<{ tx: TransactionView; action: 'complete' | 'cancel' } | null>(null);
  const [busy, setBusy] = useState(false);
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
        <Loading />
      ) : (
        <div className="stack-lg">
          <div className="grid-3">
            <Stat hot label={farmer ? 'Total sales' : 'Total spent'} value={peso(total)} sub={`${done.length} completed`} />
            <Stat label="Waiting to complete" value={pending.length} sub={pending.length ? peso(pending.reduce((s, t) => s + t.totalAmount, 0)) : 'Nothing pending'} />
            <Stat label="All transactions" value={data?.length ?? 0} />
          </div>

          <div className="card">
            {!data || data.length === 0 ? (
              <Empty icon={<Receipt size={24} />} title="No transactions yet" action={farmer ? { to: '/farmer/listings', label: 'Review your listings' } : { to: '/buyer/browse', label: 'Browse harvests' }}>
                {farmer ? 'When you accept a bid, the sale appears here.' : 'When a farmer accepts your bid, the purchase appears here.'}
              </Empty>
            ) : (
              <div className="table-wrap">
                <table className="table stack">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>{farmer ? 'Buyer' : 'Farmer'}</th>
                      <th>Quantity</th>
                      <th>Agreed price</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th>Status</th>
                      {farmer && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((t) => (
                      <tr key={t.transactionId}>
                        <td>
                          <div className="cell-prod">
                            <CropArt name={t.listing?.cropName ?? ''} src={t.listing?.imagePath} size="sm" />
                            <div className="t">{t.listing?.cropName ?? 'Removed listing'}</div>
                          </div>
                        </td>
                        <td data-label={farmer ? 'Buyer' : 'Farmer'}>
                          <div>{farmer ? t.buyer.fullName : t.farmer.farmName ?? t.farmer.fullName}</div>
                          <div className="small faint">{farmer ? t.buyer.buyerType : t.farmer.location}</div>
                        </td>
                        <td className="num" data-label="Quantity">{num(t.quantity)} {t.listing?.unit}</td>
                        <td data-label="Agreed price"><PriceTag amount={t.agreedPrice} unit={t.listing?.unit} variant="quiet" /></td>
                        <td className="num strong" data-label="Total">{peso(t.totalAmount)}</td>
                        <td className="small muted" data-label="Date">{dateShort(t.transactionDate)}</td>
                        <td data-label="Status"><StatusBadge status={t.status} /></td>
                        {farmer && (
                          <td>
                            {t.status === 'Pending' && (
                              <div className="cell-actions">
                                <button className="btn primary sm" onClick={() => setTarget({ tx: t, action: 'complete' })}><Check size={16} /> Complete</button>
                                <button className="btn danger sm" onClick={() => setTarget({ tx: t, action: 'cancel' })}><X size={16} /> Cancel</button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
