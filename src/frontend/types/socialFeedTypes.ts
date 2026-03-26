// Social Feed Type Definitions for LBC-Wallet Social Hub

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum PostType {
  Standard = 'standard',
  VerifiedPurchase = 'verified_purchase',
  Achievement = 'achievement',
  Travel = 'travel',
}

export enum VerificationStatus {
  Unverified = 'unverified',
  Verified = 'verified',
  Premium = 'premium',
}

export enum FeedFilter {
  All = 'all',
  Purchases = 'purchases',
  Achievements = 'achievements',
  Travels = 'travels',
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verificationStatus: VerificationStatus;
  walletAddress?: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  amountUSD: number;
  amountLBC: number;
  currency: 'USD' | 'LBC' | 'SOL';
  timestamp: string; // ISO 8601
  verified: boolean;
  marketplaceUrl?: string;
  productName?: string;
}

// ─── Post Metadata ────────────────────────────────────────────────────────────

export interface VerifiedPurchaseMeta {
  transaction: WalletTransaction;
  productImageUrl: string;
  productName: string;
  specifications?: string;
  marketplaceName: string;
  marketplaceUrl: string;
  celebratoryOverlay?: boolean;
}

export interface TravelMeta {
  destination: string;
  departureDate: string;  // ISO 8601 date
  returnDate: string;     // ISO 8601 date
  imageUrl: string;
  itinerarySummary: string;
  bookingConfirmationId: string;
  transaction?: WalletTransaction;
}

export interface AchievementMeta {
  title: string;
  description: string;
  iconUrl?: string;
  badgeColor?: string;
}

// ─── Core Post ────────────────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  type: PostType;
  author: SocialUser;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  createdAt: string; // ISO 8601
  likes: number;
  comments: number;
  shares: number;
  likedByMe: boolean;

  // Type-specific metadata
  verifiedPurchaseMeta?: VerifiedPurchaseMeta;
  travelMeta?: TravelMeta;
  achievementMeta?: AchievementMeta;
}

// ─── Feed State ───────────────────────────────────────────────────────────────

export interface FeedPage {
  posts: SocialPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedState {
  posts: SocialPost[];
  filter: FeedFilter;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface FeedQueryParams {
  cursor?: string;
  limit?: number;
  filter?: FeedFilter;
}

export interface LikePostPayload {
  postId: string;
  liked: boolean;
}

// ─── Social Bridge Events ─────────────────────────────────────────────────────

export interface SocialBridgeEvent {
  type: 'social.post.published' | 'social.post.liked' | 'social.post.commented';
  payload: SocialPost;
  timestamp: string;
}

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseSocialFeedReturn {
  posts: SocialPost[];
  filter: FeedFilter;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: string | null;
  setFilter: (filter: FeedFilter) => void;
  fetchMore: () => void;
  likePost: (postId: string) => void;
  refresh: () => void;
}
