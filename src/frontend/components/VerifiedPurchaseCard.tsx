import React, { memo } from 'react';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import {
  BadgeCheck,
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  Plane,
  Gem,
} from 'lucide-react';
import {
  PostType,
  SocialPost,
  TravelMeta,
  VerifiedPurchaseMeta,
} from '../types/socialFeedTypes';

// ─── Animation variants ───────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const badgeVariants: Variants = {
  hidden: { scale: 0.7, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { delay: 0.25, type: 'spring', stiffness: 300, damping: 20 },
  },
};

// ─── Confetti Particle (decorative only) ─────────────────────────────────────

const ConfettiOverlay: React.FC = () => {
  const particles = Array.from({ length: 12 });
  const colors = ['#FFD700', '#C0C0C0', '#E8D5B7', '#B8860B', '#F5F5F5'];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute block h-2 w-2 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${8 + (i * 7) % 84}%`,
            top: `${5 + (i * 11) % 40}%`,
          }}
          animate={{
            y: [0, -18, 0],
            rotate: [0, 180, 360],
            opacity: [0.9, 0.6, 0.9],
          }}
          transition={{
            duration: 2.4 + (i % 4) * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i % 6) * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// ─── Transaction Badge ────────────────────────────────────────────────────────

interface TransactionBadgeProps {
  transaction: VerifiedPurchaseMeta['transaction'];
}

const TransactionBadge: React.FC<TransactionBadgeProps> = ({ transaction }) => (
  <motion.div
    variants={badgeVariants}
    initial="hidden"
    animate="visible"
    className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
    aria-label={`Verified transaction: ${transaction.amountUSD} USD`}
  >
    <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
    <span>✅ Verified Purchase</span>
    <span className="text-emerald-200/70">•</span>
    <span>${transaction.amountUSD.toLocaleString()} USD</span>
  </motion.div>
);

// ─── Lab Diamond Ring Panel ───────────────────────────────────────────────────

interface DiamondRingPanelProps {
  meta: VerifiedPurchaseMeta;
}

const DiamondRingPanel: React.FC<DiamondRingPanelProps> = ({ meta }) => (
  <div className="relative overflow-hidden rounded-2xl">
    {/* Product image */}
    <div className="relative h-64 w-full">
      <Image
        src={meta.productImageUrl}
        alt={meta.productName}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 560px"
        priority={false}
      />
      {/* Luxury gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
        aria-hidden="true"
      />
    </div>

    {/* Confetti celebration */}
    {meta.celebratoryOverlay && <ConfettiOverlay />}

    {/* Product details overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-yellow-400">
            <Gem className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Lab Diamond
            </span>
          </div>
          <h3 className="text-base font-bold text-white drop-shadow-md">
            {meta.productName}
          </h3>
          {meta.specifications && (
            <p className="mt-0.5 text-xs text-white/70">{meta.specifications}</p>
          )}
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-300">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
            <span className="text-lg font-bold">
              {meta.transaction.amountUSD.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-white/60">
            {meta.transaction.amountLBC.toLocaleString()} LBC Credits
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Paris Trip Panel ─────────────────────────────────────────────────────────

interface TravelPanelProps {
  meta: TravelMeta;
}

const TravelPanel: React.FC<TravelPanelProps> = ({ meta }) => {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Destination image */}
      <div className="relative h-64 w-full">
        <Image
          src={meta.imageUrl}
          alt={`AI-generated scene of ${meta.destination}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 560px"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Booking confirmation badge */}
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold text-white shadow-lg"
        aria-label="Booking confirmed"
      >
        <Plane className="h-3 w-3" aria-hidden="true" />
        Booking Confirmed
      </motion.div>

      {/* Destination info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-blue-300">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Destination
              </span>
            </div>
            <h3 className="text-lg font-bold text-white drop-shadow-md">
              {meta.destination}
            </h3>
            <p className="mt-0.5 max-w-xs truncate text-xs text-white/70">
              {meta.itinerarySummary}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-white/80">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{formatDate(meta.departureDate)}</span>
            </div>
            <span className="text-xs text-white/60">
              → {formatDate(meta.returnDate)}
            </span>
            <span className="text-xs text-blue-300">
              #{meta.bookingConfirmationId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── VerifiedPurchaseCard ─────────────────────────────────────────────────────

export interface VerifiedPurchaseCardProps {
  post: SocialPost;
  /** Called when the user clicks the marketplace / itinerary link. */
  onLinkClick?: (url: string) => void;
}

/**
 * Specialised post card for wallet-verified transactions.
 *
 * Renders either a Lab Diamond Ring purchase display or a Paris Trip
 * booking display depending on the post type, plus a common transaction
 * verification section.
 */
const VerifiedPurchaseCard: React.FC<VerifiedPurchaseCardProps> = ({
  post,
  onLinkClick,
}) => {
  const isTravel = post.type === PostType.Travel;
  const purchaseMeta = post.verifiedPurchaseMeta;
  const travelMeta = post.travelMeta;
  const transaction = purchaseMeta?.transaction ?? travelMeta?.transaction;

  const handleLinkClick = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onLinkClick ? onLinkClick(url) : window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
      aria-label={`Verified ${isTravel ? 'travel booking' : 'purchase'} post by ${post.author.displayName}`}
    >
      {/* Media panel */}
      {isTravel && travelMeta ? (
        <TravelPanel meta={travelMeta} />
      ) : purchaseMeta ? (
        <DiamondRingPanel meta={purchaseMeta} />
      ) : null}

      {/* Post body */}
      <div className="p-5 space-y-4">
        {/* Verification badge */}
        {transaction && <TransactionBadge transaction={transaction} />}

        {/* Caption */}
        <p className="text-sm leading-relaxed text-white/90">{post.caption}</p>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Hashtags">
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

        {/* Transaction verification strip */}
        {transaction && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="font-semibold">Transaction Verified</span>
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>ID</span>
              <span className="font-mono">{transaction.id}</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Amount</span>
              <span>
                ${transaction.amountUSD.toLocaleString()} USD →{' '}
                {transaction.amountLBC.toLocaleString()} LBC Credits
              </span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Timestamp</span>
              <time dateTime={transaction.timestamp}>
                {new Date(transaction.timestamp).toLocaleString()}
              </time>
            </div>
          </div>
        )}

        {/* Marketplace / Itinerary link */}
        {(purchaseMeta?.marketplaceUrl || (isTravel && travelMeta)) && (
          <a
            href={
              isTravel && travelMeta
                ? `/travel/${travelMeta.bookingConfirmationId}`
                : purchaseMeta?.marketplaceUrl
            }
            onClick={handleLinkClick(
              isTravel && travelMeta
                ? `/travel/${travelMeta.bookingConfirmationId}`
                : purchaseMeta?.marketplaceUrl ?? '#'
            )}
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition-colors duration-200 hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label={
              isTravel
                ? 'View travel itinerary'
                : `View ${purchaseMeta?.marketplaceName} listing`
            }
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {isTravel ? 'View Travel Itinerary' : purchaseMeta?.marketplaceName}
          </a>
        )}
      </div>
    </motion.article>
  );
};

export default memo(VerifiedPurchaseCard);
