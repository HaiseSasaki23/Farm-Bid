/** Bids received per day over the last 7 days (today is the right-most bar). */
export function BidsChart({ bids }: { bids: { createdAt: string }[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const counts = days.map((d) => {
    const start = d.getTime();
    const end = new Date(d).setDate(d.getDate() + 1);
    return bids.filter((b) => {
      const t = new Date(b.createdAt).getTime();
      return t >= start && t < end;
    }).length;
  });
  const total = counts.reduce((a, b) => a + b, 0);
  const peak = Math.max(...counts);
  const peakIndex = peak > 0 ? counts.indexOf(peak) : -1;
  const label = days.map((d, i) => `${d.toLocaleDateString('en-PH', { weekday: 'long' })}: ${counts[i]}`).join(', ');

  return (
    <div className="chart" role="img" aria-label={`Bids per day, last 7 days. ${label}`}>
      {days.map((d, i) => (
        <div key={i} className={i === peakIndex ? 'hi' : ''}>
          <span className="chart-n">{counts[i] > 0 ? counts[i] : ''}</span>
          <i style={{ height: counts[i] > 0 ? `${Math.max(8, (counts[i] / peak) * 100)}%` : 3, ['--i' as string]: i }} className={counts[i] === 0 ? 'zero' : ''} />
          <span className="chart-d">{i === 6 ? 'Today' : d.toLocaleDateString('en-PH', { weekday: 'short' })}</span>
        </div>
      ))}
      <span className="sr-only">{total} bids in 7 days</span>
    </div>
  );
}

export function bidsInLast7Days(bids: { createdAt: string }[]) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);
  return bids.filter((b) => new Date(b.createdAt) >= since).length;
}