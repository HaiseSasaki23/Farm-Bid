import { Link } from 'react-router-dom';
import { Calendar, Gavel, MapPin, Package } from 'lucide-react';
import type { ListingView } from '../types';
import { dateShort, num } from '../lib/format';
import { CropArt, PriceTag, Stars } from './ui';

export function ListingCard({ listing: l }: { listing: ListingView }) {
  return (
    <Link to={`/buyer/listings/${l.harvestId}`} className="card listing-card">
      <CropArt name={l.cropName} src={l.imagePath} size="md" />
      <div className="body">
        <div>
          <h3>{l.cropName}</h3>
          <div className="small muted">{l.farmer.farmName ?? l.farmer.fullName}</div>
        </div>
        <div className="meta">
          <span><MapPin size={14} />{l.location}</span>
          <span><Package size={14} />{num(l.quantity)} {l.unit}</span>
          <span><Calendar size={14} />Harvested {dateShort(l.harvestDate)}</span>
        </div>
        <Stars value={l.quality} />
        <div className="foot">
          <PriceTag amount={l.startingPrice} unit={l.unit} />
          <span className="small faint row" style={{ gap: 5 }}>
            <Gavel size={14} />{l.bidCount} {l.bidCount === 1 ? 'bid' : 'bids'}
          </span>
        </div>
      </div>
    </Link>
  );
}
