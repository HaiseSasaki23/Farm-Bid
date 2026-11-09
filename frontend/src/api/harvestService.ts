import type {
  HarvestListing,
  ListingFilters,
  ListingInput,
  ListingStatus,
  ListingView,
} from '../types';
import {
  ApiError,
  currentUserId,
  delay,
  nextId,
  notify,
  publicUser,
  read,
  write,
  type Db,
} from './mockDb';

function toView(db: Db, l: HarvestListing): ListingView {
  return {
    ...l,
    farmer: publicUser(db.users.find((u) => u.userId === l.farmerId)),
    bidCount: db.bids.filter((b) => b.harvestId === l.harvestId && b.status === 'Pending').length,
  };
}

function owned(db: Db, id: number): HarvestListing {
  const me = currentUserId();
  const l = db.listings.find((x) => x.harvestId === id);
  if (!l) throw new ApiError('This listing no longer exists.');
  if (l.farmerId !== me) throw new ApiError('You can only change your own listings.');
  return l;
}

export const harvestService = {
  /** GET /api/harvests?search=&location=&minPrice=...  (available listings only) */
  async search(f: ListingFilters = {}): Promise<ListingView[]> {
    await delay(120);
    const db = read();
    const q = f.search?.trim().toLowerCase();
    let out = db.listings.filter((l) => l.status === 'Available');
    if (q) out = out.filter((l) => l.cropName.toLowerCase().includes(q));
    if (f.location) out = out.filter((l) => l.location === f.location);
    if (f.minPrice != null) out = out.filter((l) => l.startingPrice >= f.minPrice!);
    if (f.maxPrice != null) out = out.filter((l) => l.startingPrice <= f.maxPrice!);
    if (f.minQuantity != null) out = out.filter((l) => l.quantity >= f.minQuantity!);
    if (f.minQuality != null) out = out.filter((l) => l.quality >= f.minQuality!);
    switch (f.sort ?? 'newest') {
      case 'lowestPrice':
        out.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case 'highestPrice':
        out.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      default:
        out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return out.map((l) => toView(db, l));
  },

  /** GET /api/harvests/locations */
  async locations(): Promise<string[]> {
    const db = read();
    return [...new Set(db.listings.map((l) => l.location))].sort();
  },

  /** GET /api/harvests/:id */
  async get(id: number): Promise<ListingView> {
    await delay(100);
    const db = read();
    const l = db.listings.find((x) => x.harvestId === id);
    if (!l) throw new ApiError('This listing no longer exists.');
    return toView(db, l);
  },

  /** GET /api/harvests/mine */
  async mine(): Promise<ListingView[]> {
    await delay(100);
    const db = read();
    const me = currentUserId();
    return db.listings
      .filter((l) => l.farmerId === me)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => toView(db, l));
  },

  /** POST /api/harvests */
  async create(input: ListingInput): Promise<HarvestListing> {
    await delay();
    const db = read();
    const listing: HarvestListing = {
      ...input,
      harvestId: nextId(db, 'listing'),
      farmerId: currentUserId(),
      status: 'Available',
      createdAt: new Date().toISOString(),
    };
    db.listings.push(listing);
    write(db);
    return listing;
  },

  /** PUT /api/harvests/:id */
  async update(id: number, input: ListingInput): Promise<void> {
    await delay();
    const db = read();
    const l = owned(db, id);
    if (l.status === 'Reserved') {
      throw new ApiError('This listing has an accepted bid. Complete or cancel the transaction before editing.');
    }
    Object.assign(l, input);
    write(db);
  },

  /** PATCH /api/harvests/:id/status  (CloseListing -> Unavailable, MarkAsSold -> Sold, reopen -> Available) */
  async setStatus(id: number, status: Extract<ListingStatus, 'Available' | 'Unavailable' | 'Sold'>): Promise<void> {
    await delay();
    const db = read();
    const l = owned(db, id);
    if (l.status === 'Reserved') {
      throw new ApiError('This listing has an accepted bid. Complete or cancel the transaction first.');
    }
    l.status = status;
    write(db);
  },

  /** DELETE /api/harvests/:id */
  async remove(id: number): Promise<void> {
    await delay();
    const db = read();
    const l = owned(db, id);
    if (l.status === 'Reserved') {
      throw new ApiError('This listing has an accepted bid. Complete or cancel the transaction before deleting.');
    }
    // Pending bids on a removed listing are cancelled and their buyers told.
    db.bids
      .filter((b) => b.harvestId === id && b.status === 'Pending')
      .forEach((b) => {
        b.status = 'Cancelled';
        notify(db, b.buyerId, 'ListingUpdate', 'A listing was removed', `${l.cropName} is no longer for sale. Your bid was cancelled.`, '/buyer/bids');
      });
    db.listings = db.listings.filter((x) => x.harvestId !== id);
    write(db);
  },
};
