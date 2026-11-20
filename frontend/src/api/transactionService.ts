import type { RatingInput, TransactionView } from '../types';
import { ApiError, currentUserId, delay, nextId, notify, publicUser, read, write } from './mockDb';

async function finish(id: number, outcome: 'Completed' | 'Cancelled') {
  await delay(250);
  const db = read();
  const me = currentUserId();
  const tx = db.transactions.find((t) => t.transactionId === id);
  if (!tx) throw new ApiError('This transaction no longer exists.');
  if (tx.farmerId !== me) throw new ApiError('Only the farmer can update this transaction.');
  if (tx.status !== 'Pending') throw new ApiError(`This transaction is already ${tx.status.toLowerCase()}.`);
  const listing = db.listings.find((l) => l.harvestId === tx.harvestId);
  tx.status = outcome;
  if (listing) listing.status = outcome === 'Completed' ? 'Sold' : 'Available'; // cancelled -> reopen
  const verb = outcome === 'Completed' ? 'completed' : 'cancelled';
  const crop = listing?.cropName ?? 'harvest';
  notify(db, tx.buyerId, 'TransactionUpdate', `Purchase ${verb}`, `Your ${crop} purchase was ${verb}.`, '/buyer/transactions');
  notify(db, tx.farmerId, 'TransactionUpdate', `Sale ${verb}`, `Your ${crop} sale was ${verb}.`, '/farmer/transactions');
  write(db);
}

export const transactionService = {
  /** GET /api/transactions/mine */
  async mine(): Promise<TransactionView[]> {
    await delay(100);
    const db = read();
    const me = currentUserId();
    return db.transactions
      .filter((t) => t.farmerId === me || t.buyerId === me)
      .map((t) => ({
        ...t,
        listing: db.listings.find((l) => l.harvestId === t.harvestId)!,
        farmer: publicUser(db.users.find((u) => u.userId === t.farmerId)),
        buyer: publicUser(db.users.find((u) => u.userId === t.buyerId)),
        rating: db.ratings.find((r) => r.transactionId === t.transactionId) ?? null,
      }))
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  },

  /** POST /api/transactions/:id/complete */
  complete: (id: number) => finish(id, 'Completed'),

  /** POST /api/transactions/:id/cancel */
  cancel: (id: number) => finish(id, 'Cancelled'),

  /** POST /api/transactions/:id/rating  (buyer rates the farmer once, after the sale is Completed) */
  async rate(id: number, input: RatingInput): Promise<void> {
    await delay(250);
    const db = read();
    const me = currentUserId();
    const tx = db.transactions.find((t) => t.transactionId === id);
    if (!tx) throw new ApiError('This transaction no longer exists.');
    if (tx.buyerId !== me) throw new ApiError('Only the buyer of this sale can rate it.');
    if (tx.status !== 'Completed') throw new ApiError('You can rate a farmer once the sale is completed.');
    if (db.ratings.some((r) => r.transactionId === id)) throw new ApiError('You already rated this purchase.');
    if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) throw new ApiError('Choose 1 to 5 stars.');
    const comment = input.comment?.trim().slice(0, 300) || undefined;
    db.ratings.push({
      ratingId: nextId(db, 'rating'),
      transactionId: id,
      farmerId: tx.farmerId,
      buyerId: me,
      stars: input.stars,
      comment,
      createdAt: new Date().toISOString(),
    });
    const buyer = db.users.find((u) => u.userId === me);
    const crop = db.listings.find((l) => l.harvestId === tx.harvestId)?.cropName ?? 'harvest';
    notify(db, tx.farmerId, 'TransactionUpdate', 'You received a rating', `${buyer?.fullName ?? 'A buyer'} rated your ${crop} sale ${input.stars} out of 5.`, '/farmer/transactions');
    write(db);
  },
};