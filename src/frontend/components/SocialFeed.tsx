/**
 * SocialFeed — Main social feed component for the LBC-Wallet Social Hub.
 *
 * Features:
 * - Glassmorphism dark theme with Tailwind CSS
 * - Dynamic post types: standard, verified purchase, achievement, travel
 * - Real-time updates via Socket.IO (useSocialFeed hook)
 * - Post interactions: like, comment, share
 * - Verified Purchase badge for wallet-verified transactions
 * - AI-generated image placeholders
 * - Infinite scroll with "Load More" fallback
 * - Loading skeletons and empty state
 * - Framer Motion animations throughout
 * - WCAG 2.1 AA accessible markup
 */

import React, { memo, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  BadgeCheck,
  Trophy,
  ShoppingBag,
  Plane,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
} from 'lucide-react';

import { useSocialFeed } from '../hooks/useSocialFeed';
import VerifiedPurchaseCard from './VerifiedPurchaseCard';
import {
  FeedFilter,
  PostType,
  SocialPost,
  VerificationStatus,
} from '../types/socialFeedTypes';

// ─── Animation Variants ───────────────────────────────────────────────────────

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const toastVariants: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, x: 80, transition: { duration: 0.2 } },
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: FeedFilter; icon: React.ReactNode }[] = [
  { label: 'All', value: FeedFilter.All, icon: <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> },
  { label: 'Purchases', value: FeedFilter.Purchases, icon: <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> },
  { label: 'Achievements', value: FeedFilter.Achievements, icon: <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> },
  { label: 'Travels', value: FeedFilter.Travels, icon: <Plane className="h-3.5 w-3.5" aria-hidden="true" /> },
];

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const PostSkeleton: React.FC = () => (
  <div
    className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-5 space-y-4"
    aria-hidden="true"
  >
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-36 rounded bg-white/10" />
        <div className="h-2.5 w-24 rounded bg-white/8" />
      </div>
    </div>
    <div className="h-48 w-full rounded-xl bg-white/10" />
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-white/10" />
      <div className="h-3 w-3/4 rounded bg-white/10" />
    </div>
    <div className="flex gap-6">
      <div className="h-3 w-14 rounded bg-white/8" />
      <div className="h-3 w-14 rounded bg-white/8" />
      <div className="h-3 w-14 rounded bg-white/8" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ filter: FeedFilter }> = ({ filter }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/3 py-20 text-center"
    role="status"
    aria-live="polite"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
      {filter === FeedFilter.Purchases ? (
        <ShoppingBag className="h-8 w-8" aria-hidden="true" />
      ) : filter === FeedFilter.Achievements ? (
        <Trophy className="h-8 w-8" aria-hidden="true" />
      ) : filter === FeedFilter.Travels ? (
        <Plane className="h-8 w-8" aria-hidden="true" />
      ) : (
        <Wifi className="h-8 w-8" aria-hidden="true" />
      )}
    </div>
    <div>
      <p className="text-base font-semibold text-white/80">No posts yet</p>
      <p className="mt-1 text-sm text-white/40">
        {filter === FeedFilter.All
          ? 'Be the first to share something amazing!'
          : `No ${filter} to show yet. Check back soon.`}
      </p>
    </div>
  </motion.div>
);

// ─── Post Type Icon ───────────────────────────────────────────────────────────

const PostTypeIcon: React.FC<{ type: PostType }> = ({ type }) => {
  switch (type) {
    case PostType.VerifiedPurchase:
      return (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
          aria-label="Verified purchase"
          title="Verified Purchase"
        >
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      );
    case PostType.Achievement:
      return (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400"
          aria-label="Achievement"
          title="Achievement"
        >
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      );
    case PostType.Travel:
      return (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400"
          aria-label="Travel"
          title="Travel"
        >
          <Plane className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      );
    default:
      return null;
  }
};

// ─── Post Interaction Bar ─────────────────────────────────────────────────────

interface InteractionBarProps {
  post: SocialPost;
  onLike: (postId: string) => void;
}

const InteractionBar: React.FC<InteractionBarProps> = memo(({ post, onLike }) => {
  const formatCount = (n: number): string =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="flex items-center gap-6 pt-3 border-t border-white/8">
      {/* Like */}
      <button
        type="button"
        onClick={() => onLike(post.id)}
        aria-pressed={post.likedByMe}
        aria-label={`Like post. ${post.likes} likes`}
        className={`group flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
          post.likedByMe ? 'text-pink-400' : 'text-white/50 hover:text-pink-400'
        }`}
      >
        <motion.span
          animate={post.likedByMe ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`h-5 w-5 transition-all ${post.likedByMe ? 'fill-pink-400' : 'group-hover:fill-pink-400/30'}`}
            aria-hidden="true"
          />
        </motion.span>
        <span>{formatCount(post.likes)}</span>
      </button>

      {/* Comment */}
      <button
        type="button"
        aria-label={`Comment. ${post.comments} comments`}
        className="flex items-center gap-1.5 text-sm font-medium text-white/50 transition-colors duration-200 hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span>{formatCount(post.comments)}</span>
      </button>

      {/* Share */}
      <button
        type="button"
        aria-label={`Share. ${post.shares} shares`}
        className="flex items-center gap-1.5 text-sm font-medium text-white/50 transition-colors duration-200 hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
        <span>{formatCount(post.shares)}</span>
      </button>
    </div>
  );
});
InteractionBar.displayName = 'InteractionBar';

// ─── Post Header ──────────────────────────────────────────────────────────────

interface PostHeaderProps {
  post: SocialPost;
}

const PostHeader: React.FC<PostHeaderProps> = ({ post }) => {
  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="relative h-11 w-11 flex-shrink-0">
        <Image
          src={post.author.avatarUrl}
          alt={`${post.author.displayName}'s avatar`}
          fill
          className="rounded-full object-cover ring-2 ring-white/10"
          sizes="44px"
        />
        {post.author.verificationStatus === VerificationStatus.Verified && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600"
            aria-label="Verified user"
          >
            <BadgeCheck className="h-2.5 w-2.5 text-white" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">
            {post.author.displayName}
          </span>
          <PostTypeIcon type={post.type} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <span>@{post.author.username}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
        </div>
      </div>
    </div>
  );
};

// ─── Standard / Achievement Post Image ───────────────────────────────────────

const PostImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="relative h-56 w-full overflow-hidden rounded-xl">
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-500 hover:scale-105"
      sizes="(max-width: 640px) 100vw, 560px"
      priority={false}
    />
    {/* AI art watermark */}
    <div
      className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white/60 backdrop-blur-sm"
      aria-hidden="true"
    >
      AI Generated
    </div>
  </div>
);

// ─── Generic Post Card ────────────────────────────────────────────────────────

interface PostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = memo(({ post, onLike }) => {
  // Verified purchase and travel posts get the specialised card
  if (
    post.type === PostType.VerifiedPurchase ||
    (post.type === PostType.Travel && post.travelMeta?.transaction)
  ) {
    return (
      <motion.div variants={itemVariants} layout>
        <VerifiedPurchaseCard post={post} />
        <div className="mt-2 px-1">
          <InteractionBar post={post} onLike={onLike} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      variants={itemVariants}
      layout
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl space-y-4 transition-shadow duration-300 hover:shadow-indigo-500/10 hover:shadow-2xl"
      aria-label={`Post by ${post.author.displayName}`}
    >
      <PostHeader post={post} />

      {post.imageUrl && (
        <PostImage src={post.imageUrl} alt={post.caption} />
      )}

      {/* Achievement badge */}
      {post.type === PostType.Achievement && post.achievementMeta && (
        <div className="flex items-center gap-2 rounded-xl bg-yellow-500/10 px-3 py-2 text-yellow-300">
          <Trophy className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-bold">{post.achievementMeta.title}</p>
            <p className="truncate text-xs text-yellow-300/70">
              {post.achievementMeta.description}
            </p>
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed text-white/85">{post.caption}</p>

      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <InteractionBar post={post} onLike={onLike} />
    </motion.article>
  );
});
PostCard.displayName = 'PostCard';

// ─── Toast Notification ───────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => (
  <motion.div
    variants={toastVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    role="alert"
    aria-live="assertive"
    className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-900/80 px-4 py-3 shadow-2xl backdrop-blur-xl"
  >
    <Bell className="h-4 w-4 flex-shrink-0 text-indigo-300" aria-hidden="true" />
    <p className="flex-1 text-sm text-white">{message}</p>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss notification"
      className="text-white/50 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      ×
    </button>
  </motion.div>
);

// ─── SocialFeed ───────────────────────────────────────────────────────────────

export interface SocialFeedProps {
  /** Optional CSS class name for the outermost container */
  className?: string;
}

/**
 * Main Social Feed component.
 *
 * Renders a glassmorphism-styled, dark-themed infinite scroll feed that pulls
 * posts from the LBC-Wallet Social Bridge, shows verified purchase badges for
 * wallet-linked transactions, and updates in real time via WebSocket.
 */
const SocialFeed: React.FC<SocialFeedProps> = ({ className = '' }) => {
  const {
    posts,
    filter,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    setFilter,
    fetchMore,
    likePost,
    refresh,
  } = useSocialFeed();

  // ── Toast state ──────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Show toast when a new verified purchase arrives at the top of the feed
  const prevFirstPostIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (posts.length === 0) return;
    const firstPost = posts[0];
    if (
      firstPost.id !== prevFirstPostIdRef.current &&
      firstPost.type === PostType.VerifiedPurchase
    ) {
      showToast(`${firstPost.author.displayName} just made a verified purchase! 🎉`);
    }
    prevFirstPostIdRef.current = firstPost.id;
  }, [posts, showToast]);

  // ── Infinite scroll observer ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetchingMore) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, isFetchingMore]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      className={`relative mx-auto w-full max-w-2xl px-4 py-8 ${className}`}
      aria-label="Social Feed"
    >
      {/* Feed header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Social Hub
        </h1>
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          aria-label="Refresh feed"
          className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/15 hover:text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Filter posts by type"
      >
        {FILTERS.map(({ label, value, icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              filter === value
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/8 text-white/60 ring-1 ring-white/10 hover:bg-white/15 hover:text-white'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>Failed to load feed: {error}</span>
          <button
            type="button"
            onClick={refresh}
            className="ml-auto text-xs underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-5" aria-busy="true" aria-label="Loading posts">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-5"
          aria-live="polite"
          aria-relevant="additions"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={likePost} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {/* Fetch-more loading indicator */}
      {isFetchingMore && (
        <div
          className="mt-6 flex justify-center"
          aria-label="Loading more posts"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" aria-hidden="true" />
        </div>
      )}

      {/* Load More fallback button */}
      {!isFetchingMore && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={fetchMore}
            className="rounded-full bg-white/8 px-6 py-2.5 text-sm font-medium text-white/70 ring-1 ring-white/10 transition-all duration-200 hover:bg-indigo-600 hover:text-white hover:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Load more posts"
          >
            Load More
          </button>
        </div>
      )}

      {/* End-of-feed message */}
      {!hasMore && !isLoading && posts.length > 0 && (
        <p className="mt-8 text-center text-xs text-white/30" aria-live="polite">
          You've reached the end of your feed ✨
        </p>
      )}

      {/* Toast notification portal */}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toastMessage && (
            <div className="pointer-events-auto">
              <Toast
                message={toastMessage}
                onDismiss={() => setToastMessage(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default memo(SocialFeed);
