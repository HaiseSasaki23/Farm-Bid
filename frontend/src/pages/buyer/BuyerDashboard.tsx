import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, CircleCheck, Gavel, Store } from 'lucide-react';
import { bidService, harvestService, transactionService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../hooks/useQuery';
import { num, peso, timeAgo } from '../../lib/format';
import { ListingCard } from '../../components/ListingCard';
import { CropArt, Empty, ErrorBanner, Loading, PageHeader, PriceTag, Stat, StatusBadge } from '../../components/ui';

export function BuyerDashboard() {
  const { user } = useAuth();
  const q = useQuery(async () => {
    const [bids, listings, txs] = await Promise.all([bidService.mine(), harvestService.search({ sort: 'newest' }), transactionService.mine()]);
    return { bids, listings, txs };
  }, []);

  if (q.loading && !q.data) return <Loading />;
  if (q.error) return <ErrorBanner message={q.error} />;
  const { bids, listings, txs } = q.data!;

  const pending = bids.filter((b) => b.status === 'Pending');
  const accepted = bids.filter((b) => b.status === 'Accepted');
  const spent = txs.filter((t) => t.status === 'Completed').reduce((s, t) => s + t.totalAmount, 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.fullName.split(' ')[0]}`}
        subtitle={`${listings.length} harvests are open for bidding right now.`}
        actions={<Link className="btn mango" to="/buyer/browse"><Store size={18} /> Browse harvests</Link>}
      />
      <div className="stack-lg">
        <div className="grid-4">
          <Stat hot label="Pending bids" icon={<Gavel size={16} />} value={pending.length} sub={pending.length ? peso(pending.reduce((s, b) => s + b.bidAmount * b.quantity, 0)) + ' offered' : 'None waiting'} />
          <Stat label="Accepted" icon={<CircleCheck size={16} />} value={accepted.length} sub="Locked and in progress" />
          <Stat label="All bids" icon={<Gavel size={16} />} value={bids.length} sub={`${bids.filter((b) => b.status === 'Rejected').length} rejected`} />
          <Stat label="Total spent" icon={<Banknote size={16} />} value={peso(spent)} sub={`${txs.filter((t) => t.status === 'Completed').length} completed`} />
        </div>

        <section>
          <div className="spread" style={{ marginBottom: 14 }}>
            <h2>Newest harvests</h2>
            <Link to="/buyer/browse" className="small strong row" style={{ gap: 4 }}>See all <ArrowRight size={14} /></Link>
          </div>
          {listings.length === 0 ? (
            <div className="card"><Empty icon={<Store size={22} />} title="No harvests listed yet">Check back soon. Farmers post new harvests every day.</Empty></div>
          ) : (
            <div className="grid-3">{listings.slice(0, 3).map((l) => <ListingCard key={l.harvestId} listing={l} />)}</div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Your recent bids</h2>
            <Link to="/buyer/bids" className="small strong">View all</Link>
          </div>
          {bids.length === 0 ? (
            <Empty icon={<Gavel size={22} />} title="No bids yet" action={{ to: '/buyer/browse', label: 'Find a harvest' }}>Open a listing and name your price.</Empty>
          ) : (
            <div className="divided">
              {bids.slice(0, 5).map((b) => (
                <Link key={b.bidId} to={`/buyer/listings/${b.harvestId}`} className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <CropArt name={b.listing?.cropName ?? ''} src={b.listing?.imagePath} size="sm" />
                  <div className="grow">
                    <div className="strong truncate">{b.listing?.cropName}</div>
                    <div className="small muted num">{num(b.quantity)} {b.listing?.unit} · {timeAgo(b.createdAt)}</div>
                  </div>
                  <PriceTag amount={b.bidAmount} unit={b.listing?.unit} variant={b.status === 'Pending' ? undefined : 'muted-tag'} />
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
