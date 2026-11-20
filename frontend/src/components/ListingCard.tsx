import { Link } from 'react-router-dom';
import { Gavel, MapPin, Package, Sprout } from 'lucide-react';
import type { ListingView } from '../types';
import { num } from '../lib/format';
import { CropArt, GradeBadge, PriceTag, SellerStars } from './ui';

/** "Harvested today", "Harvested 3 days ago" ... so buyers can judge freshness at a glance. */
function freshness(harvestDate: string) {
  const days = Math.max(0, Math.round((Date.now() - new Date(`${harvestDate}T00:00:00`).getTime()) / 86_400_000));
  if (days <= 0) return { text: 'Harvested today', fresh: true };
  if (days === 1) return { text: 'Harvested yesterday', fresh: true };
  return { text: `Harvested ${days} days ago`, fresh: days <= 3 };
}

export function ListingCard({ listing: l }: { listing: ListingView }) {
  const f = freshness(l.harvestDate);
  return (
    <Link to={`/buyer/listings/${l.harvestId}`} className="card listing-card">
      <div className="lc-media">
        <CropArt name={l.cropName} src={l.imagePath} size="md" />
        <span className="lc-grade"><GradeBadge grade={l.grade} /></span>
        <span className="lc-bids"><Gavel size={13} /> {l.bidCount}</span>
        <div className="lc-price"><PriceTag amount={l.startingPrice} unit={l.unit} /></div>
      </div>
      <div className="body">
        <div>
          <h3>{l.cropName}</h3>
          <div className="small muted">{l.farmer.farmName ?? l.farmer.fullName}</div>
        </div>
        <div className="meta">
          <span><MapPin size={14} />{l.location}</span>
          <span><Package size={14} />{num(l.quantity)} {l.unit}</span>
        </div>
        <div className="foot">
          <span className={`fresh ${f.fresh ? 'on' : ''}`}><Sprout size={14} />{f.text}</span>
          <SellerStars rating={l.farmerRating} />
        </div>
      </div>
    </Link>
  );
}