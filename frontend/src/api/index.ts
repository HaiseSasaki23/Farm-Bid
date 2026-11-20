// Single import point for the UI. To connect the real backend, re-export HTTP-backed
// versions of these services from here (same method names and return types).
export { authService } from './authService';
export { harvestService } from './harvestService';
export { bidService } from './bidService';
export { transactionService } from './transactionService';
export { notificationService } from './notificationService';
export { aiAnalysisService } from './aiAnalysisService';
export { ApiError, resetDemoData } from './mockDb';
export { subscribe } from './events';
