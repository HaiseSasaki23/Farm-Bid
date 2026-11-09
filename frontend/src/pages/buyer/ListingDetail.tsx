import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Gavel, Info, MapPin, Package, User } from 'lucide-react';
import { bidService, harvestService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useQuery } from '../../hooks/useQuery';
import { dateShort, num, peso, timeAgo } from '../../lib/format';
import { CropArt, ErrorBanner, Loading, PriceTag, Stars, StatusBadge } from '../../components/ui';

export function ListingDetail() {
  const id = Number(useParams().id);
  const { user } = useAuth();
  const toast = useToast();
  const q = useQuery(
    async () => {
      const [listing, mine] = await Promise.all([harvestService.get(id), bidService.mine()]);
      return { listing, mine: mine.filter((b) => b.harvestId === id) };
    },
    [id],
  );

  const [amount, setAmount] = useState('');
  const [qty, setQty] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; qty?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const listing = q.data?.listing;
  useEffect(() => {
    if (listing && amount === '' && qty === '') {
      setAmount(String(listing.startingPrice));
      setQty(String(listing.quantity));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.harvestId]);

  if (q.loading && !q.data) return <Loading />;
  if (q.error || !q.data || !listing) return <><Back /><ErrorBanner message={q.error ?? 'Could not load this listing.'} /></>;

  const myBids = q.data.mine;
  const open = listing.status === 'Available';
  const total = Number(amount) * Number(qty);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: typeof errors = {};
    const a = Number(amount);
    const n = Number(qty);
    if (!(a > 0)) errs.amount = 'Enter your price per ' + listing.unit + '.';
    else if (a < listing.startingPrice) errs.amount = `Bid at least ${peso(listing.startingPrice)}, the starting price.`;
    if (!(n > 0)) errs.qty = 'Enter how much you want.';
    else if (n > listing.quantity) errs.qty = `Only ${num(listing.quantity)} ${listing.unit} available.`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await bidService.submit({ harvestId: id, bidAmount: a, quantity: n });
      toast('Bid placed. The farmer has been notified.');
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
            <Stars value={listing.quality} />
            <p style={{ lineHeight: 1.65, maxWidth: '62ch' }}>{listing.description}</p>
            <dl className="kv" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <dt><Package size={14} style={{ verticalAlign: -2 }} /> Quantity</dt><dd className="num">{num(listing.quantity)} {listing.unit}</dd>
              <dt><MapPin size={14} style={{ verticalAlign: -2 }} /> Location</dt><dd>{listing.location}</dd>
              <dt><Calendar size={14} style={{ verticalAlign: -2 }} /> Harvest date</dt><dd>{dateShort(listing.harvestDate)}</dd>
              <dt><User size={14} style={{ verticalAlign: -2 }} /> Farmer</dt><dd>{listing.farmer.fullName}</dd>
              <dt><Gavel size={14} style={{ verticalAlign: -2 }} /> Bids so far</dt><dd>{listing.bidCount}</dd>
            </dl>
          </section>
        </div>

        <div className="stack" style={{ position: 'sticky', top: 20 }}>
          <section className="card card-pad stack">
            <div>
              <div className="small faint" style={{ marginBottom: 6 }}>Starting price</div>
              <PriceTag amount={listing.startingPrice} unit={listing.unit} large />
            </div>

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
                </div>
                <div className="field">
                  <label htmlFor="qty">Quantity ({listing.unit})</label>
                  <input id="qty" type="number" step="any" min="0" className={`input ${errors.qty ? 'invalid' : ''}`} value={qty} onChange={(e) => setQty(e.target.value)} />
                  {errors.qty && <span className="error-text">{errors.qty}</span>}
                </div>
                <div className="spread" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <span className="muted">Total offer</span>
                  <strong className="num" style={{ fontSize: '1.2rem', fontFamily: 'var(--display)' }}>{Number.isFinite(total) ? peso(total) : '—'}</strong>
                </div>
                <button className="btn primary block" disabled={busy}>{busy && <span className="spinner" />} Place bid</button>
                <p className="small faint">The farmer reviews all offers and accepts one. You can cancel a bid while it is pending.</p>
              </form>
            ) : (
              <div className="banner warn"><Info size={18} /><span>{open ? 'Log in as a buyer to place a bid.' : `This listing is ${listing.status.toLowerCase()}, so it is not taking bids.`}</span></div>
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
