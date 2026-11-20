import type { AIAnalysis } from '../types';

// Do not synthesize advice in the browser. The existing API exposes market
// report endpoints, but not per-listing bid analysis in this response shape.
export const aiAnalysisService = {
  async analyze(_harvestId: number): Promise<AIAnalysis> {
    throw new Error('Per-listing bid analysis is not available from the backend yet.');
  },
};
