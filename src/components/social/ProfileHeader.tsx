/**
 * ProfileHeader
 *
 * Premium hero-section profile header for the LBC Hub Social Ecosystem.
 * Displays user bio, Solana wallet status, reputation score, profile stats,
 * and call-to-action buttons.
 */

import React, { useEffect, useState } from 'react';
import { UserProfile, ReputationTier, WalletStatus } from '../../types/social';

// ---------------------------------------------------------------------------
// Sub-types used only in this component
// ---------------------------------------------------------------------------

interface ProfileHeaderProps {
  userId: string;
  currentUserId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Duration in ms before the first-load confetti animation is hidden. */
const CONFETTI_DURATION_MS = 3000;

// ---------------------------------------------------------------------------
// Reputation tier helpers
// ---------------------------------------------------------------------------

function getTier(score: number): ReputationTier {
  if (score >= 80) return 'Gold';
  if (score >= 60) return 'Platinum';
  if (score >= 40) return 'Silver';
  return 'Bronze';
}

const TIER_STYLES: Record<ReputationTier, { bar: string; text: string; label: string }> = {
  Gold:     { bar: 'bg-yellow-400', text: 'text-yellow-400', label: '🥇 Gold Tier'     },
  Platinum: { bar: 'bg-blue-400',   text: 'text-blue-400',   label: '💎 Platinum Tier' },
  Silver:   { bar: 'bg-purple-400', text: 'text-purple-400', label: '🥈 Silver Tier'   },
  Bronze:   { bar: 'bg-gray-400',   text: 'text-gray-400',   label: '🥉 Bronze Tier'   },
};

// ---------------------------------------------------------------------------
// Wallet address masking
// ---------------------------------------------------------------------------

function maskAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Confetti animation
// ---------------------------------------------------------------------------

function Confetti() {
  const COLORS = ['#FFD700', '#9B59B6', '#FF69B4', '#00BFFF', '#FF6347'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: `confettiFall ${1.5 + Math.random()}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileHeaderSkeleton() {
  return (
    <div
      className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-700
                 animate-pulse p-6 md:p-8"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gray-700" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-700 rounded w-48" />
          <div className="h-4 bg-gray-700 rounded w-72" />
          <div className="h-3 bg-gray-700 rounded w-36" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reputation gauge card
// ---------------------------------------------------------------------------

interface ReputationGaugeProps {
  score: number;
}

function ReputationGauge({ score }: ReputationGaugeProps) {
  const tier = getTier(score);
  const styles = TIER_STYLES[tier];
  const clampedPct = Math.min(100, Math.max(0, score));

  return (
    <div
      className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-4
                 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-sm font-medium">Reputation Score</span>
        <span className={`text-xs font-bold ${styles.text}`}>{styles.label}</span>
      </div>
      <div className="flex items-end gap-3">
        <span className={`text-4xl font-extrabold ${styles.text}`}>{score}</span>
        <span className="text-gray-500 text-sm mb-1">/ 100</span>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${styles.bar}`}
          style={{ width: `${clampedPct}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wallet card
// ---------------------------------------------------------------------------

interface WalletCardProps {
  wallet: WalletStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

function WalletCard({ wallet, onConnect, onDisconnect }: WalletCardProps) {
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-yellow-900/40 to-gray-900/60
                 border border-yellow-500/30 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-yellow-400 text-lg" aria-hidden="true">◎</span>
        <span className="text-white font-semibold text-sm">Solana Wallet</span>
        {wallet.connected && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
            Connected
          </span>
        )}
      </div>

      {wallet.connected && wallet.address ? (
        <>
          <p className="text-gray-300 text-xs font-mono mb-3 truncate">
            {maskAddress(wallet.address)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-gray-800/60 rounded-lg p-2">
              <p className="text-gray-400">SOL Balance</p>
              <p className="text-white font-bold">
                {wallet.solBalance?.toFixed(4) ?? '—'} SOL
              </p>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2">
              <p className="text-gray-400">LBC Credits</p>
              <p className="text-yellow-400 font-bold">
                {wallet.lbcCreditBalance?.toLocaleString() ?? '—'}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs mb-3">
            Portfolio:{' '}
            <span className="text-green-400 font-semibold">
              ${wallet.portfolioValueUSD?.toLocaleString() ?? '—'}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onDisconnect}
              className="flex-1 text-xs py-1.5 rounded-lg border border-red-500/50
                         text-red-400 hover:bg-red-500/10 transition-colors duration-200"
            >
              Disconnect
            </button>
            <a
              href="/wallet/dashboard"
              className="flex-1 text-xs py-1.5 rounded-lg border border-yellow-500/50
                         text-yellow-400 hover:bg-yellow-500/10 transition-colors
                         duration-200 text-center"
            >
              View Transactions
            </a>
          </div>
        </>
      ) : (
        <button
          onClick={onConnect}
          className="w-full py-2 text-sm font-semibold rounded-lg
                     bg-yellow-500 text-black hover:bg-yellow-400 transition-colors duration-200"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div
      className="rounded-xl bg-gray-800/50 border border-gray-700/40 p-3
                 hover:border-yellow-500/30 hover:bg-gray-800/80 transition-all duration-200"
    >
      <p className="text-gray-400 text-xs mb-1">
        {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}
        {label}
      </p>
      <p className="text-white font-bold text-sm truncate">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProfileHeader({ userId, currentUserId }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwnProfile = userId === currentUserId;

  // ----- Data fetching -----
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const [profileRes, reputationRes, walletRes, statsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/reputation/score/${userId}`),
          fetch('/api/wallet/status'),
          fetch(`/api/users/${userId}/stats`),
        ]);

        const [profileData, reputationData, walletData, statsData] = await Promise.all([
          profileRes.json(),
          reputationRes.json(),
          walletRes.json(),
          statsRes.json(),
        ]);

        if (!cancelled) {
          setProfile({
            ...profileData,
            reputationScore: reputationData,
            walletStatus: walletData,
            stats: statsData,
          });
        }
      } catch {
        // Silently degrade — production would show an error state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => { cancelled = true; };
  }, [userId]);

  // ----- WebSocket for real-time reputation updates -----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ws: WebSocket | null = null;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${window.location.host}/api/reputation/ws/${userId}`);
      ws.onmessage = (event) => {
        try {
          const update: { score: number } = JSON.parse(event.data as string);
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  reputationScore: { ...prev.reputationScore, score: update.score },
                }
              : prev,
          );
        } catch {
          // Ignore malformed messages
        }
      };
      ws.onerror = () => ws?.close();
    } catch {
      // WS not available
    }
    return () => ws?.close();
  }, [userId]);

  // ----- Hide confetti after 3 seconds -----
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // ----- Wallet handlers (stubs — wire to actual adapter) -----
  const handleConnect = () => {
    window.dispatchEvent(new CustomEvent('lbc:wallet:connect'));
  };
  const handleDisconnect = () => {
    window.dispatchEvent(new CustomEvent('lbc:wallet:disconnect'));
  };

  // ----- Loading state -----
  if (isLoading) return <ProfileHeaderSkeleton />;

  if (!profile) {
    return (
      <div className="rounded-3xl bg-gray-900 border border-gray-700 p-8 text-center text-gray-400">
        Profile not found.
      </div>
    );
  }

  const { fullName, avatarUrl, bio, location, joinDate, isVerified, reputationScore, walletStatus, stats } =
    profile;

  return (
    <>
      {showConfetti && <Confetti />}

      {/* CSS for confetti animation (injected once) */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <section
        className="relative rounded-3xl overflow-hidden
                   bg-gradient-to-br from-gray-900 via-[#0d1628] to-gray-900
                   border border-gray-700/50 p-6 md:p-8"
        aria-label={`${fullName}'s profile`}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 50%, rgba(234,179,8,0.08) 100%)',
          }}
          aria-hidden="true"
        />

        {/* ── Top section: avatar + bio + wallet ── */}
        <div className="relative flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-offset-2
                         ring-offset-gray-900"
              style={{
                backgroundImage: 'linear-gradient(135deg,#9333ea,#ec4899,#eab308)',
                padding: '2px',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-2xl text-white font-bold">
                  {fullName.charAt(0)}
                </div>
              )}
            </div>
            {isVerified && (
              <span
                className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-6 h-6
                           flex items-center justify-center text-white text-xs border-2 border-gray-900"
                aria-label="Verified account"
                title="Verified"
              >
                ✓
              </span>
            )}
          </div>

          {/* Bio block */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-white font-extrabold text-xl md:text-2xl leading-tight">
                {fullName}
              </h1>
              {isVerified && (
                <span className="text-blue-400 text-sm" aria-label="Verified">✅</span>
              )}
            </div>
            {bio && (
              <p className="text-gray-300 text-sm mb-1">{bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              {location && (
                <span>
                  <span aria-hidden="true">📍 </span>
                  {location}
                </span>
              )}
              <span>
                <span aria-hidden="true">📅 </span>
                Member since {joinDate}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {!isOwnProfile && (
                <>
                  <button
                    onClick={() => setIsFollowing((f) => !f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200
                      ${isFollowing
                        ? 'border border-gray-600 text-gray-300 hover:bg-gray-800'
                        : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-gray-600
                               text-gray-300 hover:bg-gray-800 transition-colors duration-200"
                  >
                    Message
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    void navigator.share({ title: fullName, url: window.location.href });
                  } else {
                    void navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-gray-600
                           text-gray-300 hover:bg-gray-800 transition-colors duration-200"
              >
                Share Profile
              </button>
              <a
                href={`/social/feed?user=${userId}`}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-gray-600
                           text-gray-300 hover:bg-gray-800 transition-colors duration-200"
              >
                View Activity
              </a>
            </div>
          </div>

          {/* Wallet card (desktop: pinned right) */}
          <div className="w-full md:w-64 flex-shrink-0">
            <WalletCard
              wallet={walletStatus}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>

        {/* ── Middle: Reputation gauge ── */}
        <div className="relative mt-6">
          <ReputationGauge score={reputationScore.score} />
        </div>

        {/* ── Bottom: Profile stats grid ── */}
        <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <StatCard
            label="Total Purchases"
            value={stats.totalPurchases.toLocaleString()}
            icon="🛒"
          />
          <StatCard
            label="Spending (LBC)"
            value={stats.totalSpendingLBC.toLocaleString()}
            icon="💰"
          />
          <StatCard
            label="Spending (USD)"
            value={`$${stats.totalSpendingUSD.toLocaleString()}`}
            icon="💵"
          />
          <StatCard
            label="Verified Txns"
            value={stats.verifiedTransactionsCount.toLocaleString()}
            icon="✅"
          />
          <StatCard
            label="Avg Purchase"
            value={`$${stats.averagePurchaseValue.toLocaleString()}`}
            icon="📊"
          />
          <StatCard
            label="Top Category"
            value={stats.mostActiveCategory}
            icon="🏷️"
          />
        </div>
      </section>
    </>
  );
}

export default ProfileHeader;
