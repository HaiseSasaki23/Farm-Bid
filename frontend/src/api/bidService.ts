import type { Bid, BidView } from '../types';
import { ApiError, currentUserId, delay, nextId, notify, publicUser, read, write, type Db } from './mockDb';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function toView(db: Db, b: Bid): BidView {
  const listing = db.listings.find((l) => l.harvestId === b.harvestId)!;
  return {
    ...b,
    listing,
    buyer: publicUser(db.users.find((u) => u.userId === b.buyerId)),
    farmer: publicUser(db.users.find((u) => u.userId === listing?.farmerId)),
  };
}

export const bidService = {
  /** POST /api/bids */
  async submit(input: { harvestId: number; bidAmount: number; quantity: number }): Promise<Bid> {
    await delay();
    const db = read();
    const me = currentUserId();
    const listing = db.listings.find((l) => l.harvestId === input.harvestId);
    if (!listing) throw new ApiError('This listing no longer exists.');
    // ValidateBid: listing open, price >= starting price, quantity available
    if (listing.status !== 'Available') throw new ApiError('This listing is no longer open for bids.');
    if (input.bidAmount < listing.startingPrice) {
      throw new ApiError(`Your bid must be at least the starting price of ${peso(listing.startingPrice)} per ${listing.unit}.`);
    }
    if (input.quantity <= 0 || input.quantity > listing.quantity) {
      throw new ApiError(`Quantity must be between 1 and ${listing.quantity} ${listing.unit}.`);
    }
    const bid: Bid = {
      bidId: nextId(db, 'bid'),
      harvestId: listing.harvestId,
      buyerId: me,
      bidAmount: input.bidAmount,
      quantity: input.quantity,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.bids.push(bid);
    const buyer = db.users.find((u) => u.userId === me);
    notify(
      db,
      listing.farmerId,
      'NewBid',
      `New bid on ${listing.cropName}`,
      `${buyer?.fullName ?? 'A buyer'} bid ${peso(bid.bidAmount)}/${listing.unit} for ${bid.quantity.toLocaleString()} ${listing.unit}.`,
      `/farmer/listings/${listing.harvestId}/bids`,
    );
    write(db);
    return bid;
  },

  /** GET /api/harvests/:id/bids  (farmer) */
  async forListing(harvestId: number): Promise<BidView[]> {
    await delay(100);
    const db = read();
    const me = currentUserId();
    const listing = db.listings.find((l) => l.harvestId === harvestId);
    if (!listing || listing.farmerId !== me) throw new ApiError('You can only view bids on your own listings.');
    return db.bids
      .filter((b) => b.harvestId === harvestId)
      .map((b) => toView(db, b))
      .sort((a, b) => b.bidAmount - a.bidAmount);
  },

  /** GET /api/bids/received  (farmer, every listing) */
  async received(): Promise<BidView[]> {
    await delay(100);
    const db = read();
    const me = currentUserId();
    const mine = new Set(db.listings.filter((l) => l.farmerId === me).map((l) => l.harvestId));
    return db.bids
      .filter((b) => mine.has(b.harvestId))
      .map((b) => toView(db, b))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** GET /api/bids/mine  (buyer) */
  async mine(): Promise<BidView[]> {
    await delay(100);
    const db = read();
    const me = currentUserId();
    return db.bids
      .filter((b) => b.buyerId === me)
      .map((b) => toView(db, b))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** POST /api/bids/:id/accept */
  async accept(bidId: number): Promise<void> {
    await delay(250);
    const db = read();
    const me = currentUserId();
    const bid = db.bids.find((b) => b.bidId === bidId);
    if (!bid) throw new ApiError('This bid no longer exists.');
    const listing = db.listings.find((l) => l.harvestId === bid.harvestId)!;
    if (listing.farmerId !== me) throw new ApiError('You can only accept bids on your own listings.');
    if (bid.status !== 'Pending') throw new ApiError(`This bid is already ${bid.status.toLowerCase()}.`);
    if (listing.status !== 'Available') throw new ApiError('This listing is not open. Reopen it before accepting a bid.');

    // 1. lock the accepted bid
    bid.status = 'Accepted';
    // 2. reject every other pending bid so nothing conflicts
    db.bids
      .filter((b) => b.harvestId === bid.harvestId && b.bidId !== bid.bidId && b.status === 'Pending')
      .forEach((b) => {
        b.status = 'Rejected';
        notify(db, b.buyerId, 'BidRejected', 'Your bid was not selected', `${listing.cropName} was sold to another bid.`, '/buyer/bids');
      });
    // 3. reserve the listing and create the transaction
    listing.status = 'Reserved';
    db.transactions.push({
      transactionId: nextId(db, 'transaction'),
      bidId: bid.bidId,
      farmerId: listing.farmerId,
      buyerId: bid.buyerId,
      harvestId: listing.harvestId,
      agreedPrice: bid.bidAmount,
      quantity: bid.quantity,
      totalAmount: Math.round(bid.bidAmount * bid.quantity * 100) / 100,
      transactionDate: new Date().toISOString(),
      status: 'Pending',
    });
    // 4. tell the buyer
    notify(db, bid.buyerId, 'BidAccepted', 'Your bid was accepted', `Your bid on ${listing.cropName} (${peso(bid.bidAmount)}/${listing.unit}) was accepted.`, '/buyer/transactions');
    write(db);
  },

  /** POST /api/bids/:id/reject */
  async reject(bidId: number): Promise<void> {
    await delay();
    const db = read();
    const me = currentUserId();
    const bid = db.bids.find((b) => b.bidId === bidId);
    if (!bid) throw new ApiError('This bid no longer exists.');
    const listing = db.listings.find((l) => l.harvestId === bid.harvestId)!;
    if (listing.farmerId !== me) throw new ApiError('You can only reject bids on your own listings.');
    if (bid.status !== 'Pending') throw new ApiError(`This bid is already ${bid.status.toLowerCase()}.`);
    bid.status = 'Rejected';
    notify(db, bid.buyerId, 'BidRejected', 'Your bid was rejected', `Your bid on ${listing.cropName} was rejected.`, '/buyer/bids');
    write(db);
  },

  /** POST /api/bids/:id/cancel  (buyer, Pending only) */
  async cancel(bidId: number): Promise<void> {
    await delay();
    const db = read();
    const me = currentUserId();
    const bid = db.bids.find((b) => b.bidId === bidId);
    if (!bid || bid.buyerId !== me) throw new ApiError('You can only cancel your own bids.');
    if (bid.status !== 'Pending') throw new ApiError('Only pending bids can be cancelled. Accepted bids are locked.');
    bid.status = 'Cancelled';
    write(db);
  },
};
