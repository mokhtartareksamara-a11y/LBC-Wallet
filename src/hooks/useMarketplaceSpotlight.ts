/**
 * useMarketplaceSpotlight – Custom React hook
 *
 * Fetches and manages top-seller / spotlight items for the Social Feed.
 * Supports configurable display position, count, category filtering, and
 * automatic refresh.  Real-time updates are delivered via WebSocket.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SpotlightItem } from '../types/social';

// ---------------------------------------------------------------------------
// Hook options & return type
// ---------------------------------------------------------------------------

export interface UseMarketplaceSpotlightOptions {
  position?: 'top' | 'middle' | 'bottom';
  displayCount?: number;
  categories?: string[];
  refreshInterval?: number; // milliseconds
}

export interface UseMarketplaceSpotlightResult {
  spotlightItems: SpotlightItem[];
  isLoading: boolean;
  error: Error | null;
  refreshSpotlight: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Ranking algorithm
// ---------------------------------------------------------------------------

/**
 * Computes a composite spotlight score for ranking purposes.
 *
 * score = (averageRating * 0.25) + (log10(salesVolume) * 0.30)
 *       + (repScore / 100 * 0.25) + (verificationBonus * 0.20)
 */
function computeSpotlightScore(item: SpotlightItem): number {
  const verificationBonus = item.isVerified ? 1 : 0;
  const safeVolume = Math.max(item.salesVolume, 1);
  return (
    item.averageRating * 0.25 +
    Math.log10(safeVolume) * 0.3 +
    (item.repScore / 100) * 0.25 +
    verificationBonus * 0.2
  );
}

// ---------------------------------------------------------------------------
// Mock / seed data (replace with real API calls)
// ---------------------------------------------------------------------------

const SEED_SPOTLIGHT_ITEMS: SpotlightItem[] = [
  {
    id: 'seller_lab-diamond-co',
    type: 'SELLER',
    sellerId: 'lab-diamond-co',
    sellerName: 'Lab Diamond Co.',
    sellerAvatar: 'https://lbchub.com/sellers/lab-diamond-co/avatar.jpg',
    sellerRating: 4.9,
    sellerReviewCount: 2347,
    productName: 'Lab Diamond Gold Rings Collection',
    productImage: 'https://lbchub.com/products/diamond-rings.jpg',
    productPrice: 4500,
    productCategory: 'Jewelry',
    productRating: 4.95,
    salesVolume: 2_450_000,
    averageRating: 4.9,
    reviewCount: 8932,
    repScore: 98,
    isVerified: true,
    isFeatured: true,
    spotlightRank: 1,
    displayBadge: 'TOP_SELLER',
    cta: {
      text: 'Explore Collection',
      action: 'navigate',
      route: '/marketplace/jewelry/lab-diamond-co',
    },
  },
  {
    id: 'seller_terry-fox-auto',
    type: 'SELLER',
    sellerId: 'terry-fox-auto',
    sellerName: 'Terry Fox Auto Center',
    sellerAvatar: 'https://terryfoxauto.com/logo.jpg',
    sellerRating: 4.8,
    sellerReviewCount: 1823,
    productName: 'Premium Vehicle Service Packages',
    productImage: 'https://terryfoxauto.com/services/premium.jpg',
    productPrice: 850,
    productCategory: 'Automotive',
    productRating: 4.85,
    salesVolume: 892_500,
    averageRating: 4.8,
    reviewCount: 5621,
    repScore: 96,
    isVerified: true,
    isFeatured: true,
    spotlightRank: 2,
    displayBadge: 'TOP_SELLER',
    cta: {
      text: 'View Services',
      action: 'navigate',
      route: '/marketplace/automotive/terry-fox-auto',
    },
  },
  {
    id: 'product_paris-luxury',
    type: 'PRODUCT',
    productName: 'Paris Luxury Experience – 7 Days',
    productImage: 'https://lbchub.com/products/paris-luxury.jpg',
    productPrice: 6200,
    productCategory: 'Travel',
    productRating: 4.97,
    salesVolume: 1_250_000,
    averageRating: 4.97,
    reviewCount: 3150,
    repScore: 97,
    isVerified: true,
    isFeatured: false,
    spotlightRank: 3,
    displayBadge: 'TRENDING',
    cta: {
      text: 'Book Now',
      action: 'navigate',
      route: '/marketplace/travel/paris-luxury',
    },
  },
  {
    id: 'seller_lbc-services',
    type: 'SELLER',
    sellerId: 'lbc-services',
    sellerName: 'LBC Premium Services',
    sellerAvatar: 'https://lbchub.com/sellers/lbc-services/avatar.jpg',
    sellerRating: 4.7,
    sellerReviewCount: 987,
    productName: 'Concierge & Lifestyle Package',
    productImage: 'https://lbchub.com/products/concierge.jpg',
    productPrice: 1200,
    productCategory: 'Services',
    productRating: 4.75,
    salesVolume: 540_000,
    averageRating: 4.7,
    reviewCount: 2340,
    repScore: 91,
    isVerified: true,
    isFeatured: false,
    spotlightRank: 4,
    displayBadge: 'VERIFIED',
    cta: {
      text: 'Learn More',
      action: 'navigate',
      route: '/marketplace/services/lbc-services',
    },
  },
  {
    id: 'product_smart-watches',
    type: 'PRODUCT',
    productName: 'Luxury Smart Watch Collection',
    productImage: 'https://lbchub.com/products/smart-watches.jpg',
    productPrice: 2800,
    productCategory: 'Electronics',
    productRating: 4.82,
    salesVolume: 420_000,
    averageRating: 4.82,
    reviewCount: 1890,
    repScore: 89,
    isVerified: false,
    isFeatured: false,
    spotlightRank: 5,
    displayBadge: 'NEW',
    cta: {
      text: 'Shop Now',
      action: 'navigate',
      route: '/marketplace/electronics/smart-watches',
    },
  },
];

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function fetchSpotlightItems(
  categories?: string[],
  limit = 5,
  position: 'top' | 'middle' | 'bottom' = 'top',
): Promise<SpotlightItem[]> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    params.set('category', categories.join(','));
  }
  params.set('limit', String(limit));
  params.set('position', position);

  const res = await fetch(`/api/marketplace/spotlight?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Spotlight API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<SpotlightItem[]>;
}

// Rank and trim items client-side after fetch
function rankItems(items: SpotlightItem[], displayCount: number): SpotlightItem[] {
  return [...items]
    .sort((a, b) => computeSpotlightScore(b) - computeSpotlightScore(a))
    .slice(0, displayCount)
    .map((item, idx) => ({ ...item, spotlightRank: idx + 1 }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarketplaceSpotlight(
  options: UseMarketplaceSpotlightOptions = {},
): UseMarketplaceSpotlightResult {
  const {
    position = 'top',
    displayCount = 5,
    categories,
    refreshInterval = 6 * 60 * 60 * 1000, // 6 hours
  } = options;

  const [spotlightItems, setSpotlightItems] = useState<SpotlightItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let raw: SpotlightItem[];
      try {
        raw = await fetchSpotlightItems(categories, displayCount, position);
      } catch {
        // Fall back to seed data when API is unavailable (dev / SSR)
        raw = SEED_SPOTLIGHT_ITEMS;
      }
      const filtered =
        categories && categories.length > 0
          ? raw.filter((item) =>
              categories
                .map((c) => c.toLowerCase())
                .includes(item.productCategory.toLowerCase()),
            )
          : raw;
      setSpotlightItems(rankItems(filtered, displayCount));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load spotlight'));
    } finally {
      setIsLoading(false);
    }
  }, [categories, displayCount, position]);

  // WebSocket subscription for real-time metric updates
  const connectWS = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const ws = new WebSocket(
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/marketplace/spotlight/ws`,
      );
      ws.onmessage = (event) => {
        try {
          const update: Partial<SpotlightItem> & { id: string } = JSON.parse(event.data as string);
          setSpotlightItems((prev) => {
            const updated = prev.map((item) =>
              item.id === update.id ? { ...item, ...update } : item,
            );
            return rankItems(updated, displayCount);
          });
        } catch {
          // Ignore malformed messages
        }
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    } catch {
      // WebSocket not available (SSR or test env)
    }
  }, [displayCount]);

  // Initial load + periodic refresh
  useEffect(() => {
    void loadItems();
    connectWS();

    timerRef.current = setInterval(() => {
      void loadItems();
    }, refreshInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [loadItems, connectWS, refreshInterval]);

  const refreshSpotlight = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  return { spotlightItems, isLoading, error, refreshSpotlight };
}

export default useMarketplaceSpotlight;
