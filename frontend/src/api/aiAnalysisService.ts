import type { AIAnalysis } from '../types';
import { ApiError, currentUserId, delay, nextId, read, write } from './mockDb';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * POST /api/harvests/:id/analysis
 *
 * In production the backend's AIAnalysisService sends the bids to the Gemini API and
 * validates the response (ValidateAIResponse). This mock does the arithmetic locally and
 * writes a plain-language summary so the screen behaves the same way.
 * It throws ApiError when the "AI" cannot answer, which the UI handles.
 */
export const aiAnalysisService = {
  async analyze(harvestId: number): Promise<AIAnalysis> {
    await delay(1100);
    const db = read();
    const me = currentUserId();
    const listing = db.listings.find((l) => l.harvestId === harvestId);
    if (!listing || listing.farmerId !== me) throw new ApiError('You can only analyze bids on your own listings.');
    const pending = db.bids.filter((b) => b.harvestId === harvestId && b.status === 'Pending');
    if (pending.length === 0) throw new ApiError('There are no pending bids to analyze yet.');

    const amounts = pending.map((b) => b.bidAmount);
    const highestBid = Math.max(...amounts);
    const lowestBid = Math.min(...amounts);
    const averageBid = Math.round((amounts.reduce((s, x) => s + x, 0) / amounts.length) * 100) / 100;
    const top = pending.find((b) => b.bidAmount === highestBid)!;
    const biggest = [...pending].sort((a, b) => b.quantity - a.quantity)[0];
    const topBuyer = db.users.find((u) => u.userId === top.buyerId)?.fullName ?? 'A buyer';
    const premium = Math.round(((highestBid - listing.startingPrice) / listing.startingPrice) * 1000) / 10;

    const lines = [
      `${pending.length} pending ${pending.length === 1 ? 'bid' : 'bids'} on ${listing.cropName}, ranging from ${peso(lowestBid)} to ${peso(highestBid)} per ${listing.unit}.`,
      `The highest bid (${topBuyer}) is ${premium}% above your starting price of ${peso(listing.startingPrice)}.`,
    ];
    if (top.quantity < listing.quantity) {
      lines.push(
        `That bid covers ${top.quantity.toLocaleString()} of ${listing.quantity.toLocaleString()} ${listing.unit}. Accepting it closes the listing, so the remaining stock will not be offered to other buyers.`,
      );
    }
    if (biggest.bidId !== top.bidId && biggest.quantity === listing.quantity) {
      lines.push(`Another buyer wants your full quantity at ${peso(biggest.bidAmount)} per ${listing.unit}, which may suit you if you want to sell everything at once.`);
    }

    const analysis: AIAnalysis = {
      analysisId: nextId(db, 'analysis'),
      harvestId,
      farmerId: me,
      analysisSummary: lines.join(' '),
      highestBid,
      lowestBid,
      averageBid,
      analyzedAt: new Date().toISOString(),
    };
    db.analyses.push(analysis);
    write(db);
    return analysis;
  },
};
