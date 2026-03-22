/**
 * MarketplaceSpotlightCarousel
 *
 * Horizontally-scrollable carousel that renders SpotlightItem cards.
 * Designed for the LBC Hub Social Feed (Explore / Following tabs).
 */

import React from 'react';
import { SpotlightItem } from '../../types/social';

// ---------------------------------------------------------------------------
// Badge colours
// ---------------------------------------------------------------------------

const BADGE_STYLES: Record<SpotlightItem['displayBadge'], string> = {
  TOP_SELLER: 'bg-yellow-500 text-black',
  TRENDING: 'bg-purple-600 text-white',
  NEW: 'bg-green-600 text-white',
  VERIFIED: 'bg-blue-600 text-white',
};

const BADGE_LABELS: Record<SpotlightItem['displayBadge'], string> = {
  TOP_SELLER: '🏆 TOP SELLER',
  TRENDING: '🔥 TRENDING',
  NEW: '✨ NEW',
  VERIFIED: '✅ VERIFIED',
};

// ---------------------------------------------------------------------------
// Star rating helper
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Single spotlight card
// ---------------------------------------------------------------------------

interface SpotlightCardProps {
  item: SpotlightItem;
}

function SpotlightCard({ item }: SpotlightCardProps) {
  const badgeClass = BADGE_STYLES[item.displayBadge];
  const badgeLabel = BADGE_LABELS[item.displayBadge];

  const formattedSalesVolume =
    item.salesVolume >= 1_000_000
      ? `$${(item.salesVolume / 1_000_000).toFixed(2)}M`
      : item.salesVolume >= 1_000
      ? `$${(item.salesVolume / 1_000).toFixed(1)}K`
      : `$${item.salesVolume}`;

  return (
    <article
      className="spotlight-card flex-shrink-0 w-72 rounded-2xl overflow-hidden shadow-lg
                 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
                 border border-yellow-500/20 hover:border-yellow-400/60
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-yellow-500/20"
      style={{ minWidth: '17rem' }}
    >
      {/* Badge */}
      <div className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${badgeClass}`}>
        {badgeLabel}
      </div>

      {/* Seller header */}
      {item.sellerName && (
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          {item.sellerAvatar && (
            <img
              src={item.sellerAvatar}
              alt={item.sellerName}
              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/50"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {item.sellerName}
              {item.isVerified && (
                <span className="ml-1 text-blue-400 text-xs" aria-label="Verified seller">
                  ✅
                </span>
              )}
            </p>
            {item.sellerRating !== undefined && (
              <p className="text-yellow-400 text-xs">
                <StarRating rating={item.sellerRating} />
                <span className="text-gray-400 ml-1">
                  ({(item.sellerReviewCount ?? 0).toLocaleString()})
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Product image */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        <img
          src={item.productImage}
          alt={item.productName}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {/* Rank badge */}
        <span
          className="absolute top-2 right-2 bg-black/70 text-yellow-400
                     text-xs font-bold px-2 py-0.5 rounded-full"
        >
          #{item.spotlightRank}
        </span>
      </div>

      {/* Stats */}
      <div className="px-4 py-3">
        <h3 className="text-white font-semibold text-sm mb-1 truncate">{item.productName}</h3>
        <p className="text-yellow-400 text-xs mb-0.5">
          <StarRating rating={item.averageRating} />
          <span className="text-gray-400 ml-1">
            ({item.reviewCount.toLocaleString()} reviews)
          </span>
        </p>
        <p className="text-gray-300 text-xs mb-0.5">
          <span className="text-green-400 font-semibold">
            ${item.productPrice.toLocaleString()}
          </span>
          {'  ·  '}
          <span className="text-gray-400">{item.productCategory}</span>
        </p>
        <p className="text-gray-400 text-xs">
          Sales: {formattedSalesVolume} · Rep Score:{' '}
          <span className="text-yellow-400 font-bold">{item.repScore}/100</span>
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <a
          href={item.cta.route}
          className="flex-1 text-center text-xs font-semibold py-2 px-3 rounded-lg
                     bg-yellow-500 text-black hover:bg-yellow-400 transition-colors duration-200"
        >
          {item.cta.text}
        </a>
        {item.sellerName && (
          <a
            href={`/marketplace/sellers/${item.sellerId ?? ''}`}
            className="flex-1 text-center text-xs font-semibold py-2 px-3 rounded-lg
                       border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10
                       transition-colors duration-200"
          >
            View Seller
          </a>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 w-72 rounded-2xl overflow-hidden shadow-lg
                 bg-gray-800 animate-pulse"
      style={{ minWidth: '17rem' }}
    >
      <div className="h-6 bg-gray-700 w-full" />
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-10 h-10 rounded-full bg-gray-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-700 rounded w-3/4" />
          <div className="h-2.5 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="h-44 bg-gray-700" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-5/6" />
        <div className="h-2.5 bg-gray-700 rounded w-2/3" />
        <div className="h-2.5 bg-gray-700 rounded w-1/2" />
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <div className="flex-1 h-8 bg-gray-700 rounded-lg" />
        <div className="flex-1 h-8 bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carousel
// ---------------------------------------------------------------------------

export interface MarketplaceSpotlightCarouselProps {
  items: SpotlightItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  title?: string;
}

export function MarketplaceSpotlightCarousel({
  items,
  isLoading = false,
  skeletonCount = 3,
  title = '🏆 Top Sellers Spotlight',
}: MarketplaceSpotlightCarouselProps) {
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="marketplace-spotlight-carousel py-4" aria-label="Marketplace Spotlight">
      <h2 className="text-white font-bold text-lg px-4 mb-3">{title}</h2>
      <div
        className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="list"
      >
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={`skeleton-${i}`} role="listitem">
                <SkeletonCard />
              </div>
            ))
          : items.map((item) => (
              <div key={item.id} role="listitem">
                <SpotlightCard item={item} />
              </div>
            ))}
      </div>
    </section>
  );
}

export default MarketplaceSpotlightCarousel;
