import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, CircleCheck, Gavel, Plus, Sparkles, Sprout } from 'lucide-react';
import { bidService, harvestService, transactionService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../hooks/useQuery';
import { num, peso, timeAgo } from '../../lib/format';
import { CropArt, Empty, ErrorBanner, Loading, PageHeader, PriceTag, Stat, StatusBadge } from '../../components/ui';

export function FarmerDashboard() {
  const { user } = useAuth();
  const q = useQuery(
    async () => {
      const [listings, bids, txs] = await Promise.all([harvestService.mine(), bidService.received(), transactionService.mine()]);
      return { listings, bids, txs };
    },
    [],
  );

  if (q.loading && !q.data) return <Loading />;
  if (q.error) return <ErrorBanner message={q.error} />;
  const { listings, bids, txs } = q.data!;

  const active = listings.filter((l) => l.status === 'Available');
  const pending = bids.filter((b) => b.status === 'Pending');
  const accepted = bids.filter((b) => b.status === 'Accepted');
  const sales = txs.filter((t) => t.status === 'Completed').reduce((s, t) => s + t.totalAmount, 0);
  const busiest = [...active].sort((a, b) => b.bidCount - a.bidCount)[0];
  const firstName = user?.fullName.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Good day, ${firstName}`}
        subtitle={pending.length ? `${pending.length} ${pending.length === 1 ? 'bid is' : 'bids are'} waiting for your decision.` : 'No bids are waiting right now.'}
        actions={<Link className="btn mango" to="/farmer/listings?new=1"><Plus size={18} /> New listing</Link>}
      />

      <div className="stack-lg">
        <div className="grid-4">
          <Stat hot label="Awaiting review" icon={<Gavel size={16} />} value={pending.length} sub={pending.length ? 'Pending bids' : 'Nothing to review'} />
          <Stat label="Active listings" icon={<Sprout size={16} />} value={active.length} sub={`${listings.length} in total`} />
          <Stat label="Accepted bids" icon={<CircleCheck size={16} />} value={accepted.length} sub={`${txs.filter((t) => t.status === 'Pending').length} waiting to complete`} />
          <Stat label="Completed sales" icon={<Banknote size={16} />} value={peso(sales)} sub={`${txs.filter((t) => t.status === 'Completed').length} sales`} />
        </div>

        {busiest && busiest.bidCount > 1 && (
          <div className="ai-panel" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ maxWidth: 560 }}>
              <h2><Sparkles size={20} /> {busiest.cropName} has {busiest.bidCount} competing bids</h2>
              <p style={{ marginTop: 6 }}>Run the AI bid analysis to see the highest, lowest and average offer, with a plain-language summary.</p>
            </div>
            <Link className="btn mango" to={`/farmer/listings/${busiest.harvestId}/bids`}>Analyze these bids <ArrowRight size={18} /></Link>
          </div>
        )}

        <div className="split-wide">
          <section className="card">
            <div className="card-head">
              <h2>Bidding activity</h2>
            </div>
            {bids.length === 0 ? (
              <Empty icon={<Gavel size={22} />} title="No bids yet">Bids from buyers will appear here as soon as they are placed.</Empty>
            ) : (
              <div className="divided">
                {bids.slice(0, 7).map((b) => (
                  <Link key={b.bidId} to={`/farmer/listings/${b.harvestId}/bids`} className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CropArt name={b.listing.cropName} src={b.listing.imagePath} size="sm" />
                    <div className="grow">
                      <div className="strong truncate">{b.buyer.fullName} on {b.listing.cropName}</div>
                      <div className="small muted num">{num(b.quantity)} {b.listing.unit} · {timeAgo(b.createdAt)}</div>
                    </div>
                    <PriceTag amount={b.bidAmount} unit={b.listing.unit} variant={b.status === 'Pending' ? undefined : 'muted-tag'} />
                    <StatusBadge status={b.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Your listings</h2>
              <Link to="/farmer/listings" className="small strong">Manage</Link>
            </div>
            {listings.length === 0 ? (
              <Empty icon={<Sprout size={22} />} title="Post your first harvest" action={{ to: '/farmer/listings?new=1', label: 'Create a listing' }}>
                Add the crop, quantity and a starting price. Buyers can bid right away.
              </Empty>
            ) : (
              <div className="divided">
                {listings.slice(0, 6).map((l) => (
                  <Link key={l.harvestId} to={`/farmer/listings/${l.harvestId}/bids`} className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CropArt name={l.cropName} src={l.imagePath} size="sm" />
                    <div className="grow">
                      <div className="strong truncate">{l.cropName}</div>
                      <div className="small muted num">{num(l.quantity)} {l.unit} · {l.bidCount} pending</div>
                    </div>
                    <StatusBadge status={l.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
