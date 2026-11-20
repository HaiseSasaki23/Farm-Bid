import { Link } from 'react-router-dom';
import { Banknote, CircleCheck, Gavel, Store } from 'lucide-react';
import { bidService, harvestService, transactionService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../hooks/useQuery';
import { num, peso, timeAgo } from '../../lib/format';
import { ListingCard } from '../../components/ListingCard';
import { FeedHead, JumpBar } from '../../components/JumpBar';
import { CropArt, Empty, ErrorBanner, Loading, PageHeader, PriceTag, Stat, StatusBadge } from '../../components/ui';

export function BuyerDashboard() {
  const { user } = useAuth();
  const q = useQuery(async () => {
    const [bids, listings, txs, rated] = await Promise.all([bidService.mine(), harvestService.search({ sort: 'newest' }), transactionService.mine(), harvestService.search({ sort: 'topRated' })]);
    return { bids, listings, txs, rated };
  }, []);

  if (q.loading && !q.data) return <Loading variant="page" />;
  if (q.error) return <ErrorBanner message={q.error} />;
  const { bids, listings, txs, rated } = q.data!;
  const newest = listings.slice(0, 5);
  const topRated = rated.filter((l) => l.farmerRating.average !== null && !newest.some((n) => n.harvestId === l.harvestId)).slice(0, 3);

  const pending = bids.filter((b) => b.status === 'Pending');
  const accepted = bids.filter((b) => b.status === 'Accepted');
  const spent = txs.filter((t) => t.status === 'Completed').reduce((s, t) => s + t.totalAmount, 0);

  return (
    <>
      <PageHeader
        hero
        title={`Welcome back, ${user?.fullName.split(' ')[0]}`}
        subtitle={`${listings.length} harvests are open for bidding right now.`}
        actions={<Link className="btn mango" to="/buyer/browse"><Store size={18} /> Browse harvests</Link>}
      />
      <div className="stack-lg">
        <div className="grid-4">
          <Stat art="crate" hot label="Pending bids" icon={<Gavel size={16} />} value={pending.length} sub={pending.length ? peso(pending.reduce((s, b) => s + b.bidAmount * b.quantity, 0)) + ' offered' : 'None waiting'} />
          <Stat art="deal" label="Accepted" icon={<CircleCheck size={16} />} value={accepted.length} sub="Locked and in progress" />
          <Stat art="stall" label="All bids" icon={<Gavel size={16} />} value={bids.length} sub={`${bids.filter((b) => b.status === 'Rejected').length} rejected`} />
          <Stat art="coins" label="Total spent" icon={<Banknote size={16} />} value={spent} format={peso} sub={`${txs.filter((t) => t.status === 'Completed').length} completed`} />
        </div>

        <JumpBar items={[{ id: 'fresh', label: 'Fresh harvests' }, ...(topRated.length ? [{ id: 'rated', label: 'Top-rated sellers' }] : []), { id: 'bids', label: 'Your bids' }, { id: 'purchases', label: 'Purchases' }]} />

        <section id="fresh" className="feed-sec">
          <FeedHead title="Fresh harvests" hint="Newest lots from farmers. Bid on the whole lot." to="/buyer/browse" />
          {listings.length === 0 ? (
            <div className="card"><Empty icon={<Store size={22} />} title="No harvests listed yet">Check back soon. Farmers post new harvests every day.</Empty></div>
          ) : (
            <div className="grid-3">{newest.map((l) => <ListingCard key={l.harvestId} listing={l} />)}</div>
          )}
        </section>

        {topRated.length > 0 && (
          <section id="rated" className="feed-sec">
            <FeedHead title="From top-rated sellers" hint="Farmers other buyers rated highly after a sale." to="/buyer/browse" />
            <div className="grid-3">{topRated.map((l) => <ListingCard key={l.harvestId} listing={l} />)}</div>
          </section>
        )}

        <section id="bids" className="feed-sec">
          <FeedHead title="Your bids" hint="Where your offers stand right now." to="/buyer/bids" />
          <div className="card">
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
          </div>
        </section>

        <section id="purchases" className="feed-sec">
          <FeedHead title="Your purchases" hint="Deals the farmer has accepted." to="/buyer/transactions" />
          <div className="card">
            {txs.length === 0 ? (
              <Empty icon={<Banknote size={22} />} title="No purchases yet">When a farmer accepts your bid, the deal shows up here.</Empty>
            ) : (
              <div className="divided">
                {txs.slice(0, 4).map((t) => (
                  <Link key={t.transactionId} to="/buyer/transactions" className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CropArt name={t.listing?.cropName ?? ''} src={t.listing?.imagePath} size="sm" />
                    <div className="grow">
                      <div className="strong truncate">{t.listing?.cropName} from {t.farmer.farmName ?? t.farmer.fullName}</div>
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