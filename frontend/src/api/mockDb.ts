// A localStorage-backed fake database. Only the services in this folder touch it.
// When the real backend is ready, replace the service implementations and delete this file.

import type {
  AIAnalysis,
  AppNotification,
  Bid,
  HarvestListing,
  NotificationType,
  Rating,
  Transaction,
  User,
} from '../types';
import { emitChange } from './events';

export const DB_KEY = 'bf_db_v2'; // v2: grades, traits and ratings (old demo data is ignored)
export const TOKEN_KEY = 'bf_token';

export type UserRecord = User & { passwordHash: string };

export interface Db {
  users: UserRecord[];
  listings: HarvestListing[];
  bids: Bid[];
  transactions: Transaction[];
  notifications: AppNotification[];
  analyses: AIAnalysis[];
  ratings: Rating[];
  seq: Record<string, number>;
}

// Mock only. The real AuthService hashes passwords on the server.
export const hashPassword = (pw: string) => `mock$${btoa(unescape(encodeURIComponent(pw)))}`;

const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
const dateOnly = (days: number) => ago(days).slice(0, 10);

function seed(): Db {
  const pw = hashPassword('demo1234');
  const users: UserRecord[] = [
    { userId: 1, fullName: 'Maria Santos', email: 'farmer@demo.com', role: 'Farmer', createdAt: ago(90), isActive: true, farmName: 'Santos Family Farm', location: 'Nueva Ecija', passwordHash: pw },
    { userId: 2, fullName: 'Ramon Dela Cruz', email: 'ramon@demo.com', role: 'Farmer', createdAt: ago(70), isActive: true, farmName: 'Cruz Highland Gardens', location: 'Benguet', passwordHash: pw },
    { userId: 3, fullName: 'Liza Manalo', email: 'liza@demo.com', role: 'Farmer', createdAt: ago(60), isActive: true, farmName: 'Manalo Orchards', location: 'Guimaras', passwordHash: pw },
    { userId: 4, fullName: 'Joel Reyes', email: 'buyer@demo.com', role: 'Buyer', createdAt: ago(50), isActive: true, buyerType: 'Wholesaler', location: 'Quezon City', passwordHash: pw },
    { userId: 5, fullName: 'Anna Villanueva', email: 'anna@demo.com', role: 'Buyer', createdAt: ago(40), isActive: true, buyerType: 'Restaurant', location: 'Makati', passwordHash: pw },
    { userId: 6, fullName: 'Carlo Ong', email: 'carlo@demo.com', role: 'Buyer', createdAt: ago(30), isActive: true, buyerType: 'Retailer', location: 'Cebu City', passwordHash: pw },
  ];

  const listings: HarvestListing[] = [
    { harvestId: 1, farmerId: 1, cropName: 'Rice (Jasmine)', quantity: 2000, unit: 'kg', grade: 'A', traits: ['freshlyPicked', 'sorted', 'packed'], location: 'Nueva Ecija', harvestDate: dateOnly(3), startingPrice: 42, description: 'Freshly milled jasmine rice from the dry-season harvest. Low moisture, well sorted, packed in 50 kg sacks.', status: 'Available', createdAt: ago(3) },
    { harvestId: 2, farmerId: 1, cropName: 'Corn (Yellow)', quantity: 1500, unit: 'kg', grade: 'B', traits: ['sorted'], location: 'Nueva Ecija', harvestDate: dateOnly(5), startingPrice: 18, description: 'Yellow corn, sun-dried to 14% moisture. Suitable for feed milling.', status: 'Available', createdAt: ago(5) },
    { harvestId: 3, farmerId: 2, cropName: 'Tomato', quantity: 400, unit: 'kg', grade: 'B', traits: ['freshlyPicked', 'packed'], location: 'Benguet', harvestDate: dateOnly(1), startingPrice: 35, description: 'Firm, medium-sized tomatoes picked yesterday. Crated in 20 kg crates.', status: 'Available', createdAt: ago(1) },
    { harvestId: 4, farmerId: 2, cropName: 'Cabbage', quantity: 800, unit: 'kg', grade: 'A', traits: ['freshlyPicked', 'cleaned', 'sorted'], location: 'Benguet', harvestDate: dateOnly(2), startingPrice: 22, description: 'Dense, clean cabbage heads from cool highland fields. No pesticide residue test failures.', status: 'Available', createdAt: ago(2) },
    { harvestId: 5, farmerId: 3, cropName: 'Mango (Carabao)', quantity: 600, unit: 'kg', grade: 'A', traits: ['freshlyPicked', 'sorted', 'packed'], location: 'Guimaras', harvestDate: dateOnly(2), startingPrice: 85, description: 'Export-grade Guimaras mangoes. Sweet, even ripening, no blemishes.', status: 'Available', createdAt: ago(2) },
    { harvestId: 6, farmerId: 3, cropName: 'Banana (Lakatan)', quantity: 35, unit: 'crate', grade: 'C', traits: ['packed'], location: 'Guimaras', harvestDate: dateOnly(4), startingPrice: 650, description: 'Lakatan bananas, mixed ripeness, 18 kg per crate. Best for retail within 3 days.', status: 'Available', createdAt: ago(4) },
    { harvestId: 7, farmerId: 1, cropName: 'Eggplant', quantity: 250, unit: 'kg', grade: 'C', traits: [], location: 'Nueva Ecija', harvestDate: dateOnly(6), startingPrice: 28, description: 'Long purple eggplant, mixed sizes.', status: 'Reserved', createdAt: ago(6) },
    { harvestId: 8, farmerId: 2, cropName: 'Carrot', quantity: 500, unit: 'kg', grade: 'B', traits: ['cleaned', 'sorted'], location: 'Benguet', harvestDate: dateOnly(9), startingPrice: 30, description: 'Washed and graded carrots.', status: 'Sold', createdAt: ago(9) },
    { harvestId: 9, farmerId: 1, cropName: 'Rice (Dinorado)', quantity: 800, unit: 'kg', grade: 'A', traits: ['sorted', 'packed'], location: 'Nueva Ecija', harvestDate: dateOnly(30), startingPrice: 46, description: 'Dinorado rice, 50 kg sacks.', status: 'Sold', createdAt: ago(30) },
    { harvestId: 10, farmerId: 1, cropName: 'Corn (White)', quantity: 600, unit: 'kg', grade: 'B', traits: ['sorted'], location: 'Nueva Ecija', harvestDate: dateOnly(22), startingPrice: 20, description: 'White corn, sun-dried.', status: 'Sold', createdAt: ago(22) },
    { harvestId: 11, farmerId: 3, cropName: 'Pineapple', quantity: 40, unit: 'crate', grade: 'A', traits: ['freshlyPicked', 'packed'], location: 'Guimaras', harvestDate: dateOnly(18), startingPrice: 520, description: 'Sweet pineapples, 12 per crate.', status: 'Sold', createdAt: ago(18) },
  ];

  const bids: Bid[] = [
    { bidId: 1, harvestId: 1, buyerId: 4, bidAmount: 44, quantity: 1000, status: 'Pending', createdAt: ago(1, 3) },
    { bidId: 2, harvestId: 1, buyerId: 5, bidAmount: 46.5, quantity: 500, status: 'Pending', createdAt: ago(0, 8) },
    { bidId: 3, harvestId: 1, buyerId: 6, bidAmount: 43, quantity: 2000, status: 'Pending', createdAt: ago(0, 2) },
    { bidId: 4, harvestId: 2, buyerId: 4, bidAmount: 19, quantity: 1500, status: 'Pending', createdAt: ago(1) },
    { bidId: 5, harvestId: 3, buyerId: 5, bidAmount: 38, quantity: 200, status: 'Pending', createdAt: ago(0, 5) },
    { bidId: 6, harvestId: 5, buyerId: 4, bidAmount: 90, quantity: 300, status: 'Pending', createdAt: ago(0, 6) },
    { bidId: 7, harvestId: 7, buyerId: 5, bidAmount: 30, quantity: 250, status: 'Accepted', createdAt: ago(3) },
    { bidId: 8, harvestId: 7, buyerId: 6, bidAmount: 28, quantity: 250, status: 'Rejected', createdAt: ago(4) },
    { bidId: 9, harvestId: 8, buyerId: 4, bidAmount: 33, quantity: 500, status: 'Accepted', createdAt: ago(8) },
    { bidId: 10, harvestId: 4, buyerId: 6, bidAmount: 24, quantity: 300, status: 'Cancelled', createdAt: ago(1, 12) },
    { bidId: 11, harvestId: 9, buyerId: 5, bidAmount: 48, quantity: 800, status: 'Accepted', createdAt: ago(29) },
    { bidId: 12, harvestId: 10, buyerId: 6, bidAmount: 21, quantity: 600, status: 'Accepted', createdAt: ago(21) },
    { bidId: 13, harvestId: 11, buyerId: 5, bidAmount: 540, quantity: 40, status: 'Accepted', createdAt: ago(17) },
  ];

  const transactions: Transaction[] = [
    { transactionId: 1, bidId: 7, farmerId: 1, buyerId: 5, harvestId: 7, agreedPrice: 30, quantity: 250, totalAmount: 7500, transactionDate: ago(2), status: 'Pending' },
    { transactionId: 2, bidId: 9, farmerId: 2, buyerId: 4, harvestId: 8, agreedPrice: 33, quantity: 500, totalAmount: 16500, transactionDate: ago(7), status: 'Completed' },
    { transactionId: 3, bidId: 11, farmerId: 1, buyerId: 5, harvestId: 9, agreedPrice: 48, quantity: 800, totalAmount: 38400, transactionDate: ago(27), status: 'Completed' },
    { transactionId: 4, bidId: 12, farmerId: 1, buyerId: 6, harvestId: 10, agreedPrice: 21, quantity: 600, totalAmount: 12600, transactionDate: ago(20), status: 'Completed' },
    { transactionId: 5, bidId: 13, farmerId: 3, buyerId: 5, harvestId: 11, agreedPrice: 540, quantity: 40, totalAmount: 21600, transactionDate: ago(15), status: 'Completed' },
  ];

  // Ramon's completed sale to Joel (transaction 2) is left unrated on purpose, so you can try rating it.
  const ratings: Rating[] = [
    { ratingId: 1, transactionId: 3, farmerId: 1, buyerId: 5, stars: 5, comment: 'Exactly as described and packed well.', createdAt: ago(26) },
    { ratingId: 2, transactionId: 4, farmerId: 1, buyerId: 6, stars: 4, comment: 'Good corn, pickup was a bit late.', createdAt: ago(19) },
    { ratingId: 3, transactionId: 5, farmerId: 3, buyerId: 5, stars: 5, comment: 'Sweet and fresh. Will bid again.', createdAt: ago(14) },
  ];

  const notifications: AppNotification[] = [
    { notificationId: 1, userId: 1, type: 'NewBid', title: 'New bid on Rice (Jasmine)', message: 'Carlo Ong bid ₱43.00/kg for 2,000 kg.', isRead: false, createdAt: ago(0, 2), link: '/farmer/listings/1/bids' },
    { notificationId: 2, userId: 1, type: 'NewBid', title: 'New bid on Rice (Jasmine)', message: 'Anna Villanueva bid ₱46.50/kg for 500 kg.', isRead: false, createdAt: ago(0, 8), link: '/farmer/listings/1/bids' },
    { notificationId: 3, userId: 1, type: 'TransactionUpdate', title: 'Transaction created', message: 'Eggplant sale to Anna Villanueva is waiting to be completed.', isRead: true, createdAt: ago(2), link: '/farmer/transactions' },
    { notificationId: 4, userId: 4, type: 'BidAccepted', title: 'Your bid was accepted', message: 'Cruz Highland Gardens accepted your bid on Carrot.', isRead: true, createdAt: ago(7), link: '/buyer/transactions' },
    { notificationId: 5, userId: 4, type: 'TransactionUpdate', title: 'Purchase completed', message: 'Your Carrot purchase (₱16,500.00) is complete.', isRead: false, createdAt: ago(6), link: '/buyer/transactions' },
  ];

  return {
    users,
    listings,
    bids,
    transactions,
    notifications,
    analyses: [],
    ratings,
    seq: { user: 6, listing: 11, bid: 13, transaction: 5, notification: 5, analysis: 0, rating: 3 },
  };
}

export function read(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* fall through to seed */
  }
  const db = seed();
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable: app still works for this session only */
  }
  return db;
}

export function write(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  emitChange();
}

export function nextId(db: Db, key: keyof Db['seq']) {
  db.seq[key] = (db.seq[key] ?? 0) + 1;
  return db.seq[key];
}

export function resetDemoData() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(TOKEN_KEY);
  emitChange();
}

export function notify(
  db: Db,
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  db.notifications.push({
    notificationId: nextId(db, 'notification'),
    userId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
    link,
  });
}

export const delay = (ms = 180) => new Promise<void>((r) => setTimeout(r, ms));

export class ApiError extends Error {}

export function currentUserId(): number {
  const token = localStorage.getItem(TOKEN_KEY);
  const id = token ? Number(token.split('.')[1]) : NaN;
  if (!id) throw new ApiError('Your session has expired. Log in again.');
  return id;
}

export function publicUser(u: UserRecord | undefined) {
  if (!u) return { userId: 0, fullName: 'Unknown user', role: 'Buyer' as const };
  const { userId, fullName, role, farmName, buyerType, location } = u;
  return { userId, fullName, role, farmName, buyerType, location };
}