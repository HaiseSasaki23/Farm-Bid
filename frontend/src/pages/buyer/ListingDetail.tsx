import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, Gavel, Info, MapPin, Package, User } from 'lucide-react';
import { bidService, harvestService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useQuery } from '../../hooks/useQuery';
import { GRADE_INFO, TRAIT_LABEL, dateShort, num, peso, timeAgo } from '../../lib/format';
import { CropArt, ErrorBanner, GradeBadge, Loading, PriceTag, SellerStars, StatusBadge } from '../../components/ui';

// Quick-bid buttons add these amounts (pesos per unit) to the highest bid.
const QUICK_RAISES = [1, 2, 5];

export function ListingDetail() {
  const id = Number(useParams().id);
  const { user } = useAuth();
  const toast = useToast();
  const q = useQuery(
    async () => {
      const [listing, mine, all] = await Promise.all([harvestService.get(id), bidService.mine(), bidService.publicForListing(id)]);
      return { listing, mine: mine.filter((b) => b.harvestId === id), all };
    },
    [id],
  );

  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const listing = q.data?.listing;
  useEffect(() => {
    if (listing && amount === '') setAmount(String(listing.startingPrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.harvestId]);

  if (q.loading && !q.data) return <Loading />;
  if (q.error || !q.data || !listing) return <><Back /><ErrorBanner message={q.error ?? 'Could not load this listing.'} /></>;

  const myBids = q.data.mine;
  const allBids = q.data.all;
  const topBid = allBids.find((b) => b.status === 'Pending' || b.status === 'Accepted');
  const open = listing.status === 'Available';
  const total = Number(amount) * listing.quantity;
  const base = topBid ? topBid.offeredPrice : listing.startingPrice;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: typeof errors = {};
    const a = Number(amount);
    if (!(a > 0)) errs.amount = 'Enter your price per ' + listing.unit + '.';
    else if (a < listing.startingPrice) errs.amount = `Bid at least ${peso(listing.startingPrice)}, the starting price.`;
    else if (topBid && a <= topBid.offeredPrice) errs.amount = `Bid higher than the current highest, ${peso(topBid.offeredPrice)}.`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      // Bulk sale: every bid is for the whole lot.
      await bidService.submit({ harvestId: id, bidAmount: a, quantity: listing.quantity });
      toast('Bid placed. The farmer has been notified.', 'coin');
      void q.reload();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not place your bid.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Back />
      <div className="split-wide">
        <div className="stack-lg">
          <CropArt name={listing.cropName} src={listing.imagePath} size="lg" />
          <section className="card card-pad stack">
            <div className="spread" style={{ alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.9rem' }}>{listing.cropName}</h1>
                <div className="muted" style={{ marginTop: 4 }}>{listing.farmer.farmName ?? listing.farmer.fullName}</div>
              </div>
              <StatusBadge status={listing.status} />
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 10 }}>
                <GradeBadge grade={listing.grade} />
                <span className="small muted">{GRADE_INFO[listing.grade].label}: {GRADE_INFO[listing.grade].blurb}</span>
              </div>
              {listing.traits.length > 0 && (
                <div className="row" style={{ gap: 6 }}>
                  {listing.traits.map((t) => <span key={t} className="trait"><Check size={13} /> {TRAIT_LABEL[t]}</span>)}
                </div>
              )}
              <div className="row small muted" style={{ gap: 8 }}>
                Seller rating <SellerStars rating={listing.farmerRating} />
              </div>
            </div>
            <p style={{ lineHeight: 1.65, maxWidth: '62ch' }}>{listing.description}</p>
            <dl className="kv" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <dt><Package size={14} style={{ verticalAlign: -2 }} /> Quantity</dt><dd className="num">{num(listing.quantity)} {listing.unit}</dd>
              <dt><MapPin size={14} style={{ verticalAlign: -2 }} /> Location</dt><dd>{listing.location}</dd>
              <dt><Calendar size={14} style={{ verticalAlign: -2 }} /> Harvest date</dt><dd>{dateShort(listing.harvestDate)}</dd>
              <dt><User size={14} style={{ verticalAlign: -2 }} /> Farmer</dt><dd>{listing.farmer.fullName}</dd>
              <dt><Gavel size={14} style={{ verticalAlign: -2 }} /> Bids so far</dt><dd>{allBids.length}</dd>
            </dl>
          </section>
        </div>

        <div className="stack" style={{ position: 'sticky', top: 20 }}>
          <section className="card card-pad stack">
            <div>
              <div className="small faint" style={{ marginBottom: 6 }}>Starting price</div>
              <PriceTag amount={listing.startingPrice} unit={listing.unit} large />
            </div>
            {topBid && (
              <div className="top-bid">
                <span className="small faint">Highest bid right now</span>
                <strong className="num">{peso(topBid.offeredPrice)}/{listing.unit}</strong>
              </div>
            )}

            {user?.role === 'Buyer' && open ? (
              <form className="stack" onSubmit={submit} noValidate>
                {serverError && <ErrorBanner message={serverError} />}
                <div className="field">
                  <label htmlFor="amt">Your price per {listing.unit}</label>
                  <div className="input-affix">
                    <span className="affix">₱</span>
                    <input id="amt" type="number" step="0.01" min="0" className={`input ${errors.amount ? 'invalid' : ''}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  {errors.amount && <span className="error-text">{errors.amount}</span>}
                  <div className="quick-bids">
                    {QUICK_RAISES.map((n) => (
                      <button key={n} type="button" className="btn secondary sm" onClick={() => setAmount((base + n).toFixed(2))}>
                        +₱{n}
                      </button>
                    ))}
                    <span className="small faint">over the {topBid ? 'highest bid' : 'starting price'}</span>
                  </div>
                </div>
                <div className="banner info"><Package size={18} /><span>Bulk sale. You buy the whole lot of <strong>{num(listing.quantity)} kg</strong> or nothing, so just name your price per kg.</span></div>
                <div className="spread" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <span className="muted">Total offer</span>
                  <strong className="num" style={{ fontSize: '1.2rem', fontFamily: 'var(--display)' }}>{Number.isFinite(total) ? peso(total) : '—'}</strong>
                </div>
                <button className="btn primary block" disabled={busy}>{busy && <span className="spinner" />} Place bid</button>
                <p className="small faint">The farmer reviews all offers and accepts one. Everyone can see the bids, so you can outbid others before the deadline.</p>
              </form>
            ) : (
              <div className="banner warn"><Info size={18} /><span>{open ? 'Log in as a buyer to place a bid.' : `This listing is ${listing.status.toLowerCase()}, so it is not taking bids.`}</span></div>
            )}
          </section>

          <section className="card">
            <div className="card-head"><h2>All bids ({allBids.length})</h2></div>
            {allBids.length === 0 ? (
              <p className="small faint" style={{ padding: '0 20px 20px' }}>No bids yet. Be the first to bid.</p>
            ) : (
              <div className="divided">
                {allBids.map((b, i) => (
                  <div key={b.id} className={`row-item${b.isMine ? ' bid-mine' : ''}`}>
                    <div className="grow">
                      <div className="strong num">
                        {peso(b.offeredPrice)}/{listing.unit}
                        {i === 0 && b.status !== 'Rejected' && <span className="bid-lead">Highest</span>}
                      </div>
                      <div className="small faint">{b.isMine ? 'You' : b.bidder} · {timeAgo(b.createdAt)}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {myBids.length > 0 && (
            <section className="card">
              <div className="card-head"><h2>Your bids on this listing</h2></div>
              <div className="divided">
                {myBids.map((b) => (
                  <div key={b.bidId} className="row-item">
                    <div className="grow">
                      <div className="strong num">{peso(b.bidAmount)}/{listing.unit} × {num(b.quantity)}</div>
                      <div className="small faint">{timeAgo(b.createdAt)}</div>
                    </div>
                    <StatusBadge status={b.status} />
                    {b.status === 'Pending' && (
                      <button className="btn ghost sm" onClick={() => bidService.cancel(b.bidId).then(() => toast('Bid cancelled.')).catch((e) => toast(e.message, 'error'))}>Cancel</button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Back() {
  return (
    <Link to="/buyer/browse" className="btn ghost sm" style={{ marginBottom: 14, marginLeft: -8 }}>
      <ArrowLeft size={16} /> Browse harvests
    </Link>
  );
}