// Domain types. Field names follow the class diagram (camelCased).

export type Role = 'Farmer' | 'Buyer';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
  isActive: boolean;
  // Farmer
  farmName?: string;
  // Buyer
  buyerType?: string;
  // Both
  location?: string;
}

/** What other users are allowed to see about someone. */
export type PublicUser = Pick<User, 'userId' | 'fullName' | 'role' | 'farmName' | 'buyerType' | 'location'>;

export type Grade = 'A' | 'B' | 'C';
export type Trait = 'freshlyPicked' | 'sorted' | 'cleaned' | 'packed';

export type ListingStatus = 'Available' | 'Reserved' | 'Sold' | 'Unavailable';

export interface HarvestListing {
  harvestId: number;
  farmerId: number;
  cropName: string;
  quantity: number;
  unit: string;
  grade: Grade; // declared by the farmer; see GRADE_INFO for what each grade means
  traits: Trait[]; // checkable facts about the harvest
  location: string;
  harvestDate: string; // ISO date
  startingPrice: number; // per unit
  description: string;
  imagePath?: string; // URL or data URL
  status: ListingStatus;
  createdAt: string;
}

export type BidStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export interface Bid {
  bidId: number;
  harvestId: number;
  buyerId: number;
  bidAmount: number; // price per unit
  quantity: number;
  status: BidStatus;
  createdAt: string;
}

export type TransactionStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface Transaction {
  transactionId: number;
  bidId: number;
  farmerId: number;
  buyerId: number;
  harvestId: number;
  agreedPrice: number; // per unit
  quantity: number;
  totalAmount: number;
  transactionDate: string;
  status: TransactionStatus;
}

export type NotificationType =
  | 'NewBid'
  | 'BidAccepted'
  | 'BidRejected'
  | 'BidCancelled'
  | 'TransactionUpdate'
  | 'ListingUpdate';

/** A buyer's rating of a farmer, given once per completed transaction. */
export interface Rating {
  ratingId: number;
  transactionId: number;
  farmerId: number;
  buyerId: number;
  stars: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface SellerRating {
  average: number | null; // null = no ratings yet ("New seller")
  count: number;
}

export interface AppNotification {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AIAnalysis {
  analysisId: number;
  harvestId: number;
  farmerId: number;
  analysisSummary: string;
  highestBid: number;
  lowestBid: number;
  averageBid: number;
  analyzedAt: string;
}

// ---- View models (what the screens consume) ----

export interface ListingView extends HarvestListing {
  farmer: PublicUser;
  bidCount: number; // pending bids
  farmerRating: SellerRating;
}

export interface BidView extends Bid {
  listing: HarvestListing;
  buyer: PublicUser;
  farmer: PublicUser;
}

export interface TransactionView extends Transaction {
  listing: HarvestListing;
  farmer: PublicUser;
  buyer: PublicUser;
  rating: Rating | null; // the buyer's rating of this sale, if given
}

// ---- Inputs ----

export interface RatingInput {
  stars: number;
  comment?: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  farmName?: string;
  buyerType?: string;
  location: string;
}

export interface ListingInput {
  cropName: string;
  quantity: number;
  unit: string;
  grade: Grade;
  traits: Trait[];
  location: string;
  harvestDate: string;
  startingPrice: number;
  description: string;
  imagePath?: string;
}

export interface ListingFilters {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  minGrade?: Grade; // 'A' = grade A only, 'B' = B or better
  sort?: 'newest' | 'lowestPrice' | 'highestPrice' | 'topRated';
}