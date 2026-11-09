import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Gavel, Info, Sparkles, X } from 'lucide-react';
import { aiAnalysisService, bidService, harvestService } from '../../api';
import { useQuery } from '../../hooks/useQuery';
import { useToast } from '../../context/ToastContext';
import { dateShort, num, peso, timeAgo } from '../../lib/format';
import type { AIAnalysis, BidView } from '../../types';
import { Confirm, CropArt, Empty, ErrorBanner, Loading, PriceTag, Stars, StatusBadge } from '../../components/ui';

export function ListingBids() {
  const id = Number(useParams().id);
  const toast = useToast();
  const q = useQuery(async () => ({ listing: await harvestService.get(id), bids: await bidService.forListing(id) }), [id]);

  const [ai, setAi] = useState<AIAnalysis | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ bid: BidView; action: 'accept' | 'reject' } | null>(null);
  const [busy, setBusy] = useState(false);

  if (q.loading && !q.data) return <Loading />;
  if (q.error || !q.data) return <><BackLink /><ErrorBanner message={q.error ?? 'Could not load this listing.'} /></>;
  const { listing, bids } = q.data;

  const pending = bids.filter((b) => b.status === 'Pending');
  const topAmount = pending.length ? Math.max(...pending.map((b) => b.bidAmount)) : null;
  const open = listing.status === 'Available';

  const analyze = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      setAi(await aiAnalysisService.analyze(id));
    } catch (e) {
      setAi(null);
      setAiError(e instanceof Error ? e.message : 'Analysis unavailable.');
    } finally {
      setAiBusy(false);
    }
  };

  const decide = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      if (decision.action === 'accept') {
        await bidService.accept(decision.bid.bidId);
        toast(`Bid accepted. ${decision.bid.buyer.fullName} was notified and a sale was created.`);
      } else {
        await bidService.reject(decision.bid.bidId);
        toast('Bid rejected. The buyer was notified.');
      }
      setAi(null);
      setDecision(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update the bid.', 'error');
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BackLink />
      <div className="card card-pad row" style={{ gap: 18, marginBottom: 22 }}>
        <div style={{ width: 96 }}><CropArt name={listing.cropName} src={listing.imagePath} size="md" /></div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="row"><h1 style={{ fontSize: '1.6rem' }}>{listing.cropName}</h1><StatusBadge status={listing.status} /></div>
          <div className="muted num" style={{ marginTop: 4 }}>
            {num(listing.quantity)} {listing.unit} · {listing.location} · harvested {dateShort(listing.harvestDate)}
          </div>
          <div style={{ marginTop: 6 }}><Stars value={listing.quality} /></div>
        </div>
        <div>
          <div className="small faint" style={{ marginBottom: 4 }}>Starting price</div>
          <PriceTag amount={listing.startingPrice} unit={listing.unit} variant="quiet" large />
        </div>
      </div>

      {!open && listing.status !== 'Reserved' && (
        <div className="banner warn" style={{ marginBottom: 18 }}><Info size={18} /><span>This listing is {listing.status.toLowerCase()}. Reopen it from My listings to accept new bids.</span></div>
      )}
      {listing.status === 'Reserved' && (
        <div className="banner info" style={{ marginBottom: 18 }}><Info size={18} /><span>A bid on this listing was accepted. Finish the sale under <Link to="/farmer/transactions">Sales</Link>.</span></div>
      )}

      <div className="split">
        <section className="card">
          <div className="card-head">
            <h2>Offers <span className="faint" style={{ fontWeight: 500 }}>({bids.length})</span></h2>
            <span className="small muted">Highest first</span>
          </div>
          {bids.length === 0 ? (
            <Empty icon={<Gavel size={22} />} title="No offers yet">Buyers can see this listing in Browse. Offers will appear here as they arrive.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table compact stack-sm">
                <thead><tr><th>Buyer</th><th>Offer</th><th>Quantity</th><th>Total</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {bids.map((b) => (
                    <tr key={b.bidId}>
                      <td className="wrap">
                        <div className="strong">{b.buyer.fullName}</div>
                        <div className="small faint">{b.buyer.buyerType} · {b.buyer.location} · {timeAgo(b.createdAt)}</div>
                      </td>
                      <td data-label="Offer"><PriceTag amount={b.bidAmount} unit={listing.unit} variant={b.status === 'Pending' && b.bidAmount === topAmount ? 'top' : 'muted-tag'} /></td>
                      <td className="num" data-label="Quantity">{num(b.quantity)} {listing.unit}{b.quantity < listing.quantity && <div className="small faint">of {num(listing.quantity)}</div>}</td>
                      <td className="num strong" data-label="Total">{peso(b.bidAmount * b.quantity)}</td>
                      <td data-label="Status"><StatusBadge status={b.status} /></td>
                      <td>
                        {b.status === 'Pending' && (
                          <div className="cell-actions v">
                            <button className="btn primary sm" disabled={!open} onClick={() => setDecision({ bid: b, action: 'accept' })}><Check size={16} /> Accept</button>
                            <button className="btn danger sm" onClick={() => setDecision({ bid: b, action: 'reject' })}><X size={16} /> Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="ai-panel">
          <h2><Sparkles size={20} /> AI bid analysis</h2>
          <p style={{ marginTop: 8, color: '#b4d3c1' }}>Compare pending offers and get a short summary. You decide; the analysis is advice only.</p>

          {ai && (
            <>
              <div className="nums">
                <div><small>Highest</small><strong className="num">{peso(ai.highestBid)}</strong></div>
                <div><small>Average</small><strong className="num">{peso(ai.averageBid)}</strong></div>
                <div><small>Lowest</small><strong className="num">{peso(ai.lowestBid)}</strong></div>
              </div>
              <p className="summary">{ai.analysisSummary}</p>
              <p className="small" style={{ marginTop: 10, color: '#a8cbb6' }}>Analyzed {timeAgo(ai.analyzedAt)}. Prices are per {listing.unit}.</p>
            </>
          )}
          {aiError && (
            <div className="banner error" style={{ marginTop: 14 }} role="alert">
              <Info size={18} />
              <span>{aiError} You can still accept or reject offers yourself.</span>
            </div>
          )}
          <button className="btn mango block" style={{ marginTop: 16 }} onClick={analyze} disabled={aiBusy || pending.length === 0}>
            {aiBusy ? <><span className="spinner" /> Analyzing offers…</> : ai ? 'Run again' : 'Analyze offers'}
          </button>
          {pending.length === 0 && <p className="small" style={{ marginTop: 10, color: '#a8cbb6' }}>No pending offers to analyze.</p>}
        </aside>
      </div>

      {decision && (
        <Confirm
          title={decision.action === 'accept' ? `Accept ${decision.bid.buyer.fullName}'s offer?` : 'Reject this offer?'}
          confirmLabel={decision.action === 'accept' ? 'Accept offer' : 'Reject offer'}
          danger={decision.action === 'reject'}
          busy={busy}
          onConfirm={decide}
          onClose={() => setDecision(null)}
        >
          <p className="strong num">{peso(decision.bid.bidAmount)}/{listing.unit} × {num(decision.bid.quantity)} {listing.unit} = {peso(decision.bid.bidAmount * decision.bid.quantity)}</p>
          {decision.action === 'accept' ? (
            <p>
              This locks the bid and creates a sale.
              {pending.length > 1 ? ` The other ${pending.length - 1} pending ${pending.length - 1 === 1 ? 'offer is' : 'offers are'} rejected automatically.` : ''}
              {decision.bid.quantity < listing.quantity ? ` The listing closes to new bids, even though this offer covers only part of your stock.` : ''}
            </p>
          ) : (
            <p>The buyer is told their offer was rejected. This cannot be undone.</p>
          )}
        </Confirm>
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link to="/farmer/listings" className="btn ghost sm" style={{ marginBottom: 14, marginLeft: -8 }}>
      <ArrowLeft size={16} /> My listings
    </Link>
  );
}
