import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, Layers, Percent, Sparkles, Wallet } from 'lucide-react';
import { aiAnalysisService, bidService, harvestService } from '../../api';
import { useQuery } from '../../hooks/useQuery';
import { num, peso, timeAgo } from '../../lib/format';
import type { AIAnalysis } from '../../types';
import { CropArt, Empty, ErrorBanner, GradeBadge, Loading, PageHeader, Stat } from '../../components/ui';

/** Where the offers sit compared with your starting price. */
function RangeBar({ lo, hi, avg, start }: { lo: number; hi: number; avg: number; start: number }) {
  const min = Math.min(lo, start);
  const max = Math.max(hi, start);
  const span = max - min || 1;
  const pos = (v: number) => `${((v - min) / span) * 100}%`;
  return (
    <div className="range" role="img" aria-label={`Offers from ${peso(lo)} to ${peso(hi)}, average ${peso(avg)}, starting price ${peso(start)}`}>
      <div className="range-track">
        <i className="range-fill" style={{ left: pos(lo), width: `max(8px, calc(${pos(hi)} - ${pos(lo)}))` }} />
        <b className="range-start" style={{ left: pos(start) }}><em>Start</em></b>
        <b className="range-avg" style={{ left: pos(avg) }} title={`Average ${peso(avg)}`} />
      </div>
    </div>
  );
}

export function Insights() {
  const q = useQuery(async () => {
    const [listings, bids] = await Promise.all([harvestService.mine(), bidService.received()]);
    return { listings, bids };
  }, []);
  const [results, setResults] = useState<Record<number, AIAnalysis>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  if (q.loading && !q.data) return <Loading variant="page" />;
  if (q.error || !q.data) return <ErrorBanner message={q.error ?? 'Could not load your insights.'} />;
  const { listings, bids } = q.data;

  const active = listings.filter((l) => l.status === 'Available');
  const rows = active
    .map((l) => {
      const pending = bids.filter((b) => b.harvestId === l.harvestId && b.status === 'Pending');
      const amounts = pending.map((b) => b.bidAmount);
      const hi = amounts.length ? Math.max(...amounts) : 0;
      const lo = amounts.length ? Math.min(...amounts) : 0;
      const avg = amounts.length ? amounts.reduce((s, x) => s + x, 0) / amounts.length : 0;
      const premium = l.startingPrice > 0 ? ((hi - l.startingPrice) / l.startingPrice) * 100 : 0;
      return { l, pending, hi, lo, avg, premium };
    })
    .filter((r) => r.pending.length > 0)
    .sort((a, b) => b.pending.length - a.pending.length);
  const quiet = active.filter((l) => !rows.some((r) => r.l.harvestId === l.harvestId));

  const offers = rows.reduce((s, r) => s + r.pending.length, 0);
  const onTable = rows.reduce((s, r) => s + r.pending.reduce((t, b) => t + b.bidAmount * b.quantity, 0), 0);
  const bestPremium = rows.length ? Math.max(...rows.map((r) => r.premium)) : null;

  const run = async (id: number) => {
    setBusy(id);
    setErrors((e) => ({ ...e, [id]: '' }));
    try {
      const a = await aiAnalysisService.analyze(id);
      setResults((r) => ({ ...r, [id]: a }));
    } catch (e) {
      setErrors((x) => ({ ...x, [id]: e instanceof Error ? e.message : 'Analysis unavailable.' }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        hero
        title="AI insights"
        subtitle="See how your offers compare with your prices, then ask the AI for a plain-language summary. You always make the final call."
      />

      <div className="stack-lg">
        <div className="grid-4">
          <Stat hot label="Listings with offers" icon={<Layers size={16} />} value={rows.length} sub={`${active.length} active in total`} />
          <Stat label="Offers waiting" icon={<Gavel size={16} />} value={offers} sub={offers ? 'Pending your decision' : 'Nothing pending'} />
          <Stat label="Best offer vs start" icon={<Percent size={16} />} value={bestPremium == null ? '–' : `${bestPremium >= 0 ? '+' : ''}${bestPremium.toFixed(1)}%`} sub="Highest bid above your price" />
          <Stat label="Value on the table" icon={<Wallet size={16} />} value={onTable} format={peso} sub="All pending offers combined" />
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <Empty icon={<Sparkles size={22} />} title="No offers to analyze yet" action={{ to: '/farmer/listings', label: 'Go to My listings' }}>
              When buyers bid on your harvests, you will see how the offers compare here and can ask the AI to summarize them.
            </Empty>
          </div>
        ) : (
          <section className="stack">
            <h2>Listings to review</h2>
            {rows.map(({ l, pending, hi, lo, avg, premium }) => {
              const res = results[l.harvestId];
              const err = errors[l.harvestId];
              return (
                <article key={l.harvestId} className="card ins-card">
                  <div className="ins-head">
                    <div className="ins-photo"><CropArt name={l.cropName} src={l.imagePath} size="md" /></div>
                    <div className="grow">
                      <h3>{l.cropName}</h3>
                      <div className="small muted num">{num(l.quantity)} {l.unit} · starts at {peso(l.startingPrice)}/{l.unit}</div>
                    </div>
                    <GradeBadge grade={l.grade} />
                    <span className="ins-count"><Gavel size={14} /> {pending.length} {pending.length === 1 ? 'offer' : 'offers'}</span>
                  </div>

                  <RangeBar lo={lo} hi={hi} avg={avg} start={l.startingPrice} />

                  <div className="ins-nums">
                    <div><small>Lowest</small><strong className="num">{peso(lo)}</strong></div>
                    <div><small>Average</small><strong className="num">{peso(avg)}</strong></div>
                    <div><small>Highest</small><strong className="num">{peso(hi)}</strong></div>
                    <div className={premium >= 0 ? 'up' : 'down'}><small>Top vs start</small><strong className="num">{premium >= 0 ? '+' : ''}{premium.toFixed(1)}%</strong></div>
                  </div>

                  {res && (
                    <div className="ins-ai">
                      <Sparkles size={18} />
                      <div>
                        <p>{res.analysisSummary}</p>
                        <small>Analyzed {timeAgo(res.analyzedAt)}. Prices are per {l.unit}.</small>
                      </div>
                    </div>
                  )}
                  {err && <div className="banner error" role="alert"><span>{err} You can still review the offers yourself.</span></div>}

                  <div className="ins-actions">
                    <button className="btn mango" onClick={() => run(l.harvestId)} disabled={busy !== null}>
                      {busy === l.harvestId ? <><span className="spinner" /> Analyzing offers…</> : <><Sparkles size={17} /> {res ? 'Run again' : 'Analyze with AI'}</>}
                    </button>
                    <Link className="btn secondary" to={`/farmer/listings/${l.harvestId}/bids`}>Review offers <ArrowRight size={16} /></Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {quiet.length > 0 && (
          <section className="card">
            <div className="card-head"><h2>Waiting for offers</h2><span className="small muted">No bids yet</span></div>
            <div className="divided">
              {quiet.map((l) => (
                <Link key={l.harvestId} to="/farmer/listings" className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <CropArt name={l.cropName} src={l.imagePath} size="sm" />
                  <div className="grow">
                    <div className="strong truncate">{l.cropName}</div>
                    <div className="small muted num">{num(l.quantity)} {l.unit} · {peso(l.startingPrice)}/{l.unit} · posted {timeAgo(l.createdAt)}</div>
                  </div>
                  <span className="small faint">{l.imagePath ? 'Try a fresher price' : 'Add a photo to get more bids'}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}