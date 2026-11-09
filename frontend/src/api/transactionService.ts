import type { TransactionView } from '../types';
import { ApiError, currentUserId, delay, notify, publicUser, read, write } from './mockDb';

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
      }))
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  },

  /** POST /api/transactions/:id/complete */
  complete: (id: number) => finish(id, 'Completed'),

  /** POST /api/transactions/:id/cancel */
  cancel: (id: number) => finish(id, 'Cancelled'),
};
