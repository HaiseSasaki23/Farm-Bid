import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, CircleCheck, Gavel, Plus, Sparkles, Sprout } from 'lucide-react';
import { bidService, harvestService, transactionService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../hooks/useQuery';
import { num, peso, timeAgo } from '../../lib/format';
import { BidsChart, bidsInLast7Days } from '../../components/BidsChart';
import { FarmerListingCard } from '../../components/FarmerListingCard';
import { FeedHead, JumpBar } from '../../components/JumpBar';
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

  if (q.loading && !q.data) return <Loading variant="page" />;
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
        hero
        title={`Good day, ${firstName}`}
        subtitle={pending.length ? `${pending.length} ${pending.length === 1 ? 'bid is' : 'bids are'} waiting for your decision.` : 'No bids are waiting right now.'}
        actions={<Link className="btn mango" to="/farmer/listings?new=1"><Plus size={18} /> New listing</Link>}
      />

      <div className="stack-lg">
        <div className="grid-4">
          <Stat art="crate" hot label="Awaiting review" icon={<Gavel size={16} />} value={pending.length} sub={pending.length ? 'Pending bids' : 'Nothing to review'} />
          <Stat art="stall" label="Active listings" icon={<Sprout size={16} />} value={active.length} sub={`${listings.length} in total`} />
          <Stat art="deal" label="Accepted bids" icon={<CircleCheck size={16} />} value={accepted.length} sub={`${txs.filter((t) => t.status === 'Pending').length} waiting to complete`} />
          <Stat art="coins" label="Completed sales" icon={<Banknote size={16} />} value={sales} format={peso} sub={`${txs.filter((t) => t.status === 'Completed').length} sales`} />
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

        <JumpBar items={[{ id: 'overview', label: 'Overview' }, { id: 'listings', label: 'Your listings' }, { id: 'activity', label: 'Bidding activity' }, { id: 'sales', label: 'Recent sales' }]} />

        <section id="overview" className="card feed-sec">
          <div className="card-head">
            <h2>Bids per day</h2>
            <span className="small muted">Last 7 days · {bidsInLast7Days(bids)} {bidsInLast7Days(bids) === 1 ? 'bid' : 'bids'}</span>
          </div>
          <div style={{ padding: '6px 20px 16px' }}><BidsChart bids={bids} /></div>
        </section>

        <section id="listings" className="feed-sec">
          <FeedHead title="Your listings" hint="What buyers see in the market right now." to="/farmer/listings" link="Manage" />
          {listings.length === 0 ? (
            <div className="card"><Empty icon={<Sprout size={22} />} title="Post your first harvest" action={{ to: '/farmer/listings?new=1', label: 'Create a listing' }}>
              Add the crop, quantity and a starting price. Buyers can bid right away.
            </Empty></div>
          ) : (
            <div className="grid-3">{listings.slice(0, 4).map((l) => <FarmerListingCard key={l.harvestId} listing={l} />)}</div>
          )}
        </section>

        <section id="activity" className="card feed-sec">
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

        <section id="sales" className="feed-sec">
          <FeedHead title="Recent sales" hint="Deals you accepted, and where they stand." to="/farmer/transactions" />
          <div className="card">
            {txs.length === 0 ? (
              <Empty icon={<Banknote size={22} />} title="No sales yet">Accept a bid and the deal shows up here.</Empty>
            ) : (
              <div className="divided">
                {txs.slice(0, 4).map((t) => (
                  <Link key={t.transactionId} to="/farmer/transactions" className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CropArt name={t.listing?.cropName ?? ''} src={t.listing?.imagePath} size="sm" />
                    <div className="grow">
                      <div className="strong truncate">{t.listing?.cropName} to {t.buyer.fullName}</div>
                      <div className="small muted num">{num(t.quantity)} kg · {timeAgo(t.transactionDate)}</div>
                    </div>
                    <strong className="num">{peso(t.totalAmount)}</strong>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
