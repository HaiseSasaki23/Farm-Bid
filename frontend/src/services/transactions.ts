import type { HarvestListing, TransactionView } from '../types';
import { request } from '../lib/http';
import { harvestService } from './listings';

type ApiTransaction = { id: number; bidId: number; listingId: number; cropName?: string; buyerId: number; buyerName?: string; farmerId: number; farmerName?: string; agreedPrice: number; agreedQuantity: number; totalAmount: number; transactionStatus: TransactionView['status']; createdAt: string };

async function mapTransaction(value: ApiTransaction): Promise<TransactionView> {
  let listing: HarvestListing;
  try { listing = await harvestService.get(value.listingId); }
  catch { listing = { harvestId: value.listingId, farmerId: value.farmerId, cropName: value.cropName ?? 'Listing', quantity: value.agreedQuantity, unit: 'unit', grade: 'B', traits: [], location: '', harvestDate: '', startingPrice: value.agreedPrice, description: '', status: 'Sold', createdAt: value.createdAt }; }
  return { transactionId: value.id, bidId: value.bidId, farmerId: value.farmerId, buyerId: value.buyerId, harvestId: value.listingId, agreedPrice: value.agreedPrice, quantity: value.agreedQuantity, totalAmount: value.totalAmount, transactionDate: value.createdAt, status: value.transactionStatus, listing,
    farmer: { userId: value.farmerId, fullName: value.farmerName ?? 'Farmer', role: 'Farmer' }, buyer: { userId: value.buyerId, fullName: value.buyerName ?? 'Buyer', role: 'Buyer' }, rating: null };
}

export const transactionService = {
  async mine() { return Promise.all((await request<ApiTransaction[]>('/api/Transaction')).map(mapTransaction)); },
  async complete(id: number) { await request(`/api/Transaction/${id}/confirm-completion`, { method: 'PUT' }); },
  async cancel(_id: number) { throw new Error('Cancelling a transaction is not supported by the backend yet.'); },
  async rate(_id: number, _input: { stars: number; comment?: string }) { throw new Error('Ratings are not supported by the backend yet.'); },
};
