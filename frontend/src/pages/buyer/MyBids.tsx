import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { bidService } from '../../api';
import { useQuery } from '../../hooks/useQuery';
import { useToast } from '../../context/ToastContext';
import { num, peso, timeAgo } from '../../lib/format';
import type { BidStatus, BidView } from '../../types';
import { Confirm, CropArt, Empty, ErrorBanner, Loading, PageHeader, PriceTag, StatusBadge } from '../../components/ui';

const TABS: ('All' | BidStatus)[] = ['All', 'Pending', 'Accepted', 'Rejected', 'Cancelled'];

export function MyBids() {
  const toast = useToast();
  const { data, loading, error } = useQuery(() => bidService.mine(), []);
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [cancel, setCancel] = useState<BidView | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = (data ?? []).filter((b) => tab === 'All' || b.status === tab);
  const count = (t: (typeof TABS)[number]) => (t === 'All' ? data?.length ?? 0 : data?.filter((b) => b.status === t).length ?? 0);

  const doCancel = async () => {
    if (!cancel) return;
    setBusy(true);
    try {
      await bidService.cancel(cancel.bidId);
      toast('Bid cancelled.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not cancel the bid.', 'error');
    } finally {
      setBusy(false);
      setCancel(null);
    }
  };

  return (
    <>
      <PageHeader title="My bids" subtitle="Track every offer you have made. Accepted bids are locked and become purchases." />
      {error && <ErrorBanner message={error} />}
      <div className="tabs" role="group" aria-label="Filter by status">
        {TABS.map((t) => (
          <button key={t} className="tab" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t} <span className="n">{count(t)}</span>
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="card">
          <Empty icon={<Gavel size={24} />} title={tab === 'All' ? 'You have not placed any bids' : `No ${tab.toLowerCase()} bids`} action={tab === 'All' ? { to: '/buyer/browse', label: 'Browse harvests' } : undefined}>
            {tab === 'All' ? 'Open a listing and name your price to place your first bid.' : 'Switch tabs to see your other bids.'}
          </Empty>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table stack">
              <thead><tr><th>Product</th><th>Your offer</th><th>Quantity</th><th>Total</th><th>Placed</th><th>Status</th><th /></tr></thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={b.bidId}>
                    <td>
                      <div className="cell-prod">
                        <CropArt name={b.listing?.cropName ?? ''} src={b.listing?.imagePath} size="sm" />
                        <div>
                          <div className="t">{b.listing?.cropName ?? 'Removed listing'}</div>
                          <div className="small faint">{b.farmer.farmName ?? b.farmer.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Your offer"><PriceTag amount={b.bidAmount} unit={b.listing?.unit} variant={b.status === 'Accepted' ? 'top' : b.status === 'Pending' ? undefined : 'muted-tag'} /></td>
                    <td className="num" data-label="Quantity">{num(b.quantity)} {b.listing?.unit}</td>
                    <td className="num strong" data-label="Total">{peso(b.bidAmount * b.quantity)}</td>
                    <td className="small muted" data-label="Placed">{timeAgo(b.createdAt)}</td>
                    <td data-label="Status"><StatusBadge status={b.status} /></td>
                    <td>
                      <div className="cell-actions">
                        {b.status === 'Pending' && <button className="btn danger sm" onClick={() => setCancel(b)}>Cancel bid</button>}
                        {b.status === 'Accepted' && <Link className="btn secondary sm" to="/buyer/transactions">View purchase</Link>}
                        {b.listing && b.status !== 'Accepted' && <Link className="btn ghost sm" to={`/buyer/listings/${b.harvestId}`}>View listing</Link>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cancel && (
        <Confirm title="Cancel this bid?" confirmLabel="Cancel bid" danger busy={busy} onConfirm={doCancel} onClose={() => setCancel(null)}>
          <p>Your {peso(cancel.bidAmount)}/{cancel.listing?.unit} offer on {cancel.listing?.cropName} will be withdrawn.</p>
        </Confirm>
      )}
    </>
  );
}
