import type { Bid, BidView, HarvestListing } from '../types';
import { request } from '../lib/http';
import { harvestService } from './listings';

type ApiBid = { id: number; listingId: number; listingTitle: string; cropName?: string; buyerId: number; buyerName?: string; offeredPrice: number; requestedQuantity: number; status: Bid['status']; createdAt: string };
export type PublicBid = { id: number; bidder: string; offeredPrice: number; requestedQuantity: number; status: Bid['status']; createdAt: string; isMine: boolean };

async function mapBid(value: ApiBid): Promise<BidView> {
  let listing: HarvestListing;
  try { listing = await harvestService.get(value.listingId); }
  catch { listing = { harvestId: value.listingId, farmerId: 0, cropName: value.cropName ?? value.listingTitle, quantity: value.requestedQuantity, unit: 'unit', grade: 'B', traits: [], location: '', harvestDate: '', startingPrice: 0, description: '', status: 'Unavailable', createdAt: value.createdAt }; }
  return { bidId: value.id, harvestId: value.listingId, buyerId: value.buyerId, bidAmount: value.offeredPrice, quantity: value.requestedQuantity, status: value.status, createdAt: value.createdAt,
    listing, buyer: { userId: value.buyerId, fullName: value.buyerName ?? 'Buyer', role: 'Buyer' }, farmer: { userId: listing.farmerId, fullName: 'Farmer', role: 'Farmer' } };
}

export const bidService = {
  async submit(input: { harvestId: number; bidAmount: number; quantity: number }): Promise<Bid> {
    const value = await request<ApiBid>('/api/Bid', { method: 'POST', body: JSON.stringify({ listingId: input.harvestId, offeredPrice: input.bidAmount, requestedQuantity: input.quantity }) });
    return { bidId: value.id, harvestId: value.listingId, buyerId: value.buyerId, bidAmount: value.offeredPrice, quantity: value.requestedQuantity, status: value.status, createdAt: value.createdAt };
  },
  async received() { return Promise.all((await request<ApiBid[]>('/api/Bid')).map(mapBid)); },
  async mine() { return Promise.all((await request<ApiBid[]>('/api/Bid')).map(mapBid)); },
  async forListing(harvestId: number) { return (await Promise.all((await request<ApiBid[]>('/api/Bid')).filter(x => x.listingId === harvestId).map(mapBid))).sort((a, b) => b.bidAmount - a.bidAmount); },
  async publicForListing(harvestId: number) { return request<PublicBid[]>(`/api/Bid/listing/${harvestId}/public`); },
  async accept(id: number) {
    await request(`/api/Bid/${id}/decision`, { method: 'PUT', body: JSON.stringify({ decision: 'Accept' }) });
    await request(`/api/Transaction/from-accepted-bid/${id}`, { method: 'POST' });
  },
  async reject(id: number) { await request(`/api/Bid/${id}/decision`, { method: 'PUT', body: JSON.stringify({ decision: 'Reject' }) }); },
  async cancel(id: number) { await request(`/api/Bid/${id}/cancel`, { method: 'PUT' }); },
};
