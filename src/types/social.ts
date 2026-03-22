// Shared TypeScript interfaces for the LBC Hub Social Ecosystem

export type ReputationTier = 'Gold' | 'Platinum' | 'Silver' | 'Bronze';

export interface WalletStatus {
  connected: boolean;
  address?: string;
  solBalance?: number;
  lbcCreditBalance?: number;
  portfolioValueUSD?: number;
}

export interface ReputationScore {
  score: number;
  tier: ReputationTier;
  breakdown: {
    purchasesCompleted: number;
    verifiedTransactionAmount: number;
    reviewsReceived: number;
    socialEngagement: number;
    sellerRating: number;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  joinDate: string;
  isVerified: boolean;
  walletStatus: WalletStatus;
  reputationScore: ReputationScore;
  stats: UserStats;
}

export interface UserStats {
  totalPurchases: number;
  totalSpendingLBC: number;
  totalSpendingUSD: number;
  verifiedTransactionsCount: number;
  averagePurchaseValue: number;
  mostActiveCategory: string;
}

// Spotlight / Marketplace types

export type SpotlightType = 'SELLER' | 'PRODUCT' | 'COLLECTION';
export type DisplayBadge = 'TOP_SELLER' | 'TRENDING' | 'NEW' | 'VERIFIED';

export interface SpotlightItem {
  id: string;
  type: SpotlightType;

  // Seller Info (if SELLER)
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerRating?: number;
  sellerReviewCount?: number;

  // Product Info
  productName: string;
  productImage: string;
  productPrice: number;
  productCategory: string;
  productRating?: number;

  // Spotlight Metrics
  salesVolume: number;
  averageRating: number;
  reviewCount: number;
  repScore: number;
  isVerified: boolean;
  isFeatured: boolean;
  spotlightRank: number;

  // Metadata
  displayBadge: DisplayBadge;
  cta: {
    text: string;
    action: string;
    route: string;
  };
}

// AI Art Prompt types

export type ArtStyle = 'cinematic' | 'luxury' | 'minimalist' | 'dreamy';

export interface PurchaseData {
  itemName: string;
  category: string;
  price: number;
  description?: string;
  location?: string;
  rating?: number;
}

export interface AIArtPromptResult {
  dallEPrompt: string;
  midjourneyPrompt: string;
  styleKeywords: string[];
  estimatedRenderTime: number;
}
