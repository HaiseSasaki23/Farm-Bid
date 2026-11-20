import type { HarvestListing, ListingFilters, ListingInput, ListingStatus, ListingView } from '../types';
import { request } from '../lib/http';

type ApiListing = {
  id: number; farmerId: number; title: string; description: string; quantity: number; unit: string;
  startingPrice: number; quality: string; location: string; harvestDate: string; createdAt: string; status: string;
  farmer?: { id: number; fullName: string }; crop?: { id: number; cropName: string };
};
type Crop = { id: number; cropName: string };

const status = (value: string): ListingStatus => value === 'Active' ? 'Available' : value === 'Closed' ? 'Sold' : 'Unavailable';
const grade = (quality: string): 'A' | 'B' | 'C' => quality.toUpperCase().startsWith('A') ? 'A' : quality.toUpperCase().startsWith('C') ? 'C' : 'B';

function mapListing(value: ApiListing): ListingView {
  return {
    harvestId: value.id, farmerId: value.farmerId, cropName: value.crop?.cropName ?? value.title,
    quantity: value.quantity, unit: value.unit, grade: grade(value.quality), traits: [], location: value.location,
    harvestDate: value.harvestDate.slice(0, 10), startingPrice: value.startingPrice, description: value.description,
    status: status(value.status), createdAt: value.createdAt,
    farmer: { userId: value.farmer?.id ?? value.farmerId, fullName: value.farmer?.fullName ?? 'Farmer', role: 'Farmer' },
    bidCount: 0, farmerRating: { average: null, count: 0 },
  };
}

async function currentUserId() {
  const user = await request<{ id: number }>('/api/User/me');
  return user.id;
}

async function cropIdFor(name: string) {
  const crops = await request<Crop[]>('/api/Crop');
  const crop = crops.find(x => x.cropName.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
  if (!crop) throw new Error(`“${name}” is not in the crop catalog. Ask an administrator to add it first.`);
  return crop.id;
}

function sortAndFilter(listings: ListingView[], f: ListingFilters) {
  const search = f.search?.trim().toLowerCase();
  let out = listings.filter(x => x.status === 'Available');
  if (search) out = out.filter(x => x.cropName.toLowerCase().includes(search));
  if (f.location) out = out.filter(x => x.location === f.location);
  if (f.minPrice != null) out = out.filter(x => x.startingPrice >= f.minPrice!);
  if (f.maxPrice != null) out = out.filter(x => x.startingPrice <= f.maxPrice!);
  if (f.minQuantity != null) out = out.filter(x => x.quantity >= f.minQuantity!);
  if (f.minGrade) out = out.filter(x => x.grade <= f.minGrade!);
  return out.sort((a, b) => f.sort === 'lowestPrice' ? a.startingPrice - b.startingPrice : f.sort === 'highestPrice' ? b.startingPrice - a.startingPrice : b.createdAt.localeCompare(a.createdAt));
}

export const harvestService = {
  async search(filters: ListingFilters = {}) { return sortAndFilter((await request<ApiListing[]>('/api/Listing')).map(mapListing), filters); },
  async locations() { return [...new Set((await request<ApiListing[]>('/api/Listing')).map(x => x.location))].sort(); },
  async get(id: number) { return mapListing(await request<ApiListing>(`/api/Listing/${id}`)); },
  async mine() {
    const [userId, listings] = await Promise.all([currentUserId(), request<ApiListing[]>('/api/Listing')]);
    return listings.filter(x => x.farmerId === userId).map(mapListing);
  },
  async create(input: ListingInput): Promise<HarvestListing> {
    const cropId = await cropIdFor(input.cropName);
    const body = { cropId, description: input.description, quantity: input.quantity, unit: input.unit, startingPrice: input.startingPrice,
      quality: input.grade, location: input.location, harvestDate: input.harvestDate, bidDeadline: new Date(Date.now() + 7 * 86_400_000).toISOString() };
    return mapListing(await request<ApiListing>('/api/Listing', { method: 'POST', body: JSON.stringify(body) }));
  },
  async update(id: number, input: ListingInput) {
    const cropId = await cropIdFor(input.cropName);
    await request(`/api/Listing/${id}`, { method: 'PUT', body: JSON.stringify({ cropId, description: input.description, quantity: input.quantity, unit: input.unit, startingPrice: input.startingPrice, quality: input.grade, location: input.location, harvestDate: input.harvestDate, bidDeadline: new Date(Date.now() + 7 * 86_400_000).toISOString() }) });
  },
  async remove(id: number) { await request(`/api/Listing/${id}`, { method: 'DELETE' }); },
  async setStatus(_id: number, _status: Extract<ListingStatus, 'Available' | 'Unavailable' | 'Sold'>) {
    throw new Error('Changing a listing status is not supported by the backend yet.');
  },
};
