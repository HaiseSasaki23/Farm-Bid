import { Link } from 'react-router-dom';
import { BadgeCheck, Eye, EyeOff, Gavel, MapPin, Package, Pencil, Trash2 } from 'lucide-react';
import type { ListingView } from '../types';
import { dateShort, num } from '../lib/format';
import { CropArt, GradeBadge, PriceTag, StatusBadge } from './ui';

type Actions = {
  onEdit: () => void;
  onClose: () => void;
  onReopen: () => void;
  onSold: () => void;
  onDelete: () => void;
};

/** Photo-first card for the farmer's own listings. Pass `actions` for the full manage buttons, or leave it out for a compact link card. */
export function FarmerListingCard({ listing: l, actions }: { listing: ListingView; actions?: Actions }) {
  const locked = l.status === 'Reserved';
  const media = (
    <div className="lc-media">
      <CropArt name={l.cropName} src={l.imagePath} size="md" />
      <span className="lc-grade"><GradeBadge grade={l.grade} /></span>
      <span className="lc-status"><StatusBadge status={l.status} /></span>
      <div className="lc-price"><PriceTag amount={l.startingPrice} unit={l.unit} /></div>
    </div>
  );
  const info = (
    <>
      <div>
        <h3>{l.cropName}</h3>
        <div className="small muted">Harvested {dateShort(l.harvestDate)}</div>
      </div>
      <div className="meta">
        <span><MapPin size={14} />{l.location}</span>
        <span><Package size={14} />{num(l.quantity)} {l.unit}</span>
      </div>
    </>
  );

  if (!actions) {
    return (
      <Link to={`/farmer/listings/${l.harvestId}/bids`} className="card listing-card">
        {media}
        <div className="body">
          {info}
          <div className="foot"><span className={`bidchip ${l.bidCount > 0 ? 'on' : ''}`}><Gavel size={14} /> {l.bidCount} {l.bidCount === 1 ? 'bid' : 'bids'}</span></div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card listing-card fl-card">
      {media}
      <div className="body">
        {info}
        <div className="foot">
          <Link className={`btn sm ${l.bidCount > 0 ? 'primary' : 'secondary'}`} to={`/farmer/listings/${l.harvestId}/bids`}>
            <Gavel size={15} /> {l.bidCount} {l.bidCount === 1 ? 'bid' : 'bids'}
          </Link>
          <div className="cell-actions">
            <button className="btn ghost icon" title={locked ? 'Locked while a transaction is pending' : 'Edit'} aria-label={`Edit ${l.cropName}`} disabled={locked} onClick={actions.onEdit}><Pencil size={17} /></button>
            {l.status === 'Unavailable' ? (
              <button className="btn ghost icon" title="Reopen listing" aria-label={`Reopen ${l.cropName}`} onClick={actions.onReopen}><Eye size={17} /></button>
            ) : (
              <button className="btn ghost icon" title="Close listing (mark unavailable)" aria-label={`Close ${l.cropName}`} disabled={locked || l.status === 'Sold'} onClick={actions.onClose}><EyeOff size={17} /></button>
            )}
            <button className="btn ghost icon" title="Mark as sold" aria-label={`Mark ${l.cropName} as sold`} disabled={locked || l.status === 'Sold'} onClick={actions.onSold}><BadgeCheck size={17} /></button>
            <button className="btn ghost icon" title="Delete" aria-label={`Delete ${l.cropName}`} disabled={locked} onClick={actions.onDelete}><Trash2 size={17} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}