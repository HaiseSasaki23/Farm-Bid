import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Gavel, Package } from 'lucide-react';
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
        <Loading variant="cards" />
      ) : shown.length === 0 ? (
        <div className="card">
          <Empty icon={<Gavel size={24} />} title={tab === 'All' ? 'You have not placed any bids' : `No ${tab.toLowerCase()} bids`} action={tab === 'All' ? { to: '/buyer/browse', label: 'Browse harvests' } : undefined}>
            {tab === 'All' ? 'Open a listing and name your price to place your first bid.' : 'Switch tabs to see your other bids.'}
          </Empty>
        </div>
      ) : (
        <div className="deal-grid">
          {shown.map((b) => (
            <article key={b.bidId} className={`card deal${b.status === 'Accepted' ? ' won' : ''}`}>
              <div className="deal-media">
                <CropArt name={b.listing?.cropName ?? ''} src={b.listing?.imagePath} size="md" />
                <span className="deal-status"><StatusBadge status={b.status} /></span>
              </div>
              <div className="deal-body">
                <div className="deal-top">
                  <div>
                    <h3>{b.listing?.cropName ?? 'Removed listing'}</h3>
                    <div className="small muted">{b.farmer.farmName ?? b.farmer.fullName}</div>
                  </div>
                  <div className="deal-total num">{peso(b.bidAmount * b.quantity)}</div>
                </div>
                <div className="deal-meta">
                  <span className="num"><Package size={14} /> {num(b.quantity)} {b.listing?.unit}</span>
                  <PriceTag amount={b.bidAmount} unit={b.listing?.unit} variant={b.status === 'Accepted' ? 'top' : b.status === 'Pending' ? undefined : 'muted-tag'} />
                  <span><CalendarClock size={14} /> {timeAgo(b.createdAt)}</span>
                </div>
                <div className="deal-foot">
                  <span className="small faint">{b.status === 'Accepted' ? 'Locked. Now a purchase.' : b.status === 'Pending' ? 'Waiting for the farmer' : ''}</span>
                  <div className="cell-actions">
                    {b.status === 'Pending' && <button className="btn danger sm" onClick={() => setCancel(b)}>Cancel bid</button>}
                    {b.status === 'Accepted' && <Link className="btn primary sm" to="/buyer/transactions">View purchase</Link>}
                    {b.listing && b.status !== 'Accepted' && <Link className="btn ghost sm" to={`/buyer/listings/${b.harvestId}`}>View listing</Link>}
                  </div>
                </div>
              </div>
            </article>
          ))}
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