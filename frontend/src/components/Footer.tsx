import { Link } from 'react-router-dom';
import { ArrowUp, Wheat } from 'lucide-react';
import { GRADE_INFO } from '../lib/format';
import type { Grade, Role } from '../types';

const LINKS: Record<Role, { to: string; label: string }[]> = {
  Farmer: [
    { to: '/farmer', label: 'Dashboard' },
    { to: '/farmer/listings', label: 'My listings' },
    { to: '/farmer/transactions', label: 'Sales' },
    { to: '/farmer/insights', label: 'AI insights' },
  ],
  Buyer: [
    { to: '/buyer', label: 'Dashboard' },
    { to: '/buyer/browse', label: 'Browse harvests' },
    { to: '/buyer/bids', label: 'My bids' },
    { to: '/buyer/transactions', label: 'Purchases' },
  ],
};

const STEPS: Record<Role, string[]> = {
  Farmer: ['List your harvest by the kilo.', 'Compare offers and accept the best one.', 'Confirm the pickup to close the sale.'],
  Buyer: ['Find a lot that fits your business.', 'Name your price per kg for the whole lot.', 'Pick it up once the farmer accepts.'],
};

export function Footer({ role }: { role: Role }) {
  return (
    <footer className="site-foot">
      <div className="site-foot-in">
        <div className="sf-brand">
          <div className="brand">
            <span className="brand-mark"><Wheat size={20} strokeWidth={2.4} /></span>
            <span className="brand-name">FarmBid</span>
          </div>
          <p>Fair prices, straight from the farm. Farmers list a harvest, buyers bid on the whole lot, priced per kg.</p>
        </div>

        <div>
          <h4>Around the market</h4>
          <ul>{LINKS[role].map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}</ul>
        </div>

        <div>
          <h4>How it works</h4>
          <ol>{STEPS[role].map((s) => <li key={s}>{s}</li>)}</ol>
        </div>

        <div>
          <h4>Grade guide</h4>
          <ul className="sf-grades">
            {(['A', 'B', 'C'] as Grade[]).map((g) => (
              <li key={g}><b>Grade {g}</b><span>{GRADE_INFO[g].label}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-foot-bar">
        <span>© {new Date().getFullYear()} FarmBid · Bulk produce, sold by the kilo.</span>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={15} /> Back to top</button>
      </div>
    </footer>
  );
}