'use client';

/**
 * WalletDashboard — LBC Diamond Standard
 *
 * Cinematic, futuristic React/Next.js wallet dashboard featuring:
 * - Real-time LBC credit balance with animated counter
 * - Glassmorphism dark theme (Tailwind CSS)
 * - Quick Pay button for Terry Fox Auto Center
 * - Lab Diamond Gold Ring marketplace
 * - Transaction history snippet
 * - Responsive design
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amountLbc: number;
  timestampIso: string;
}

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  priceLbc: number;
  imageEmoji: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// Static mock data (replace with live API calls in production)
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    type: 'credit',
    description: 'Nexus Bridge deposit',
    amountLbc: 2_500,
    timestampIso: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'tx_002',
    type: 'debit',
    description: 'Terry Fox Auto Center — Oil change',
    amountLbc: 120,
    timestampIso: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 'tx_003',
    type: 'debit',
    description: 'Lab Diamond Ring — Rose Gold',
    amountLbc: 4_800,
    timestampIso: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: 'tx_004',
    type: 'credit',
    description: 'LBC Marketplace cashback',
    amountLbc: 95,
    timestampIso: new Date(Date.now() - 259_200_000).toISOString(),
  },
];

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'ring_001',
    name: '18K Rose Gold Lab Diamond Ring',
    description: '1.5 ct VS1 oval-cut lab diamond, polished rose gold band',
    priceUsd: 3_200,
    priceLbc: 3_200,
    imageEmoji: '💍',
    badge: 'Best Seller',
  },
  {
    id: 'ring_002',
    name: '14K Yellow Gold Lab Diamond Ring',
    description: '2 ct round brilliant lab diamond, classic solitaire setting',
    priceUsd: 4_800,
    priceLbc: 4_800,
    imageEmoji: '💎',
    badge: 'Premium',
  },
  {
    id: 'ring_003',
    name: 'Platinum Lab Diamond Eternity Ring',
    description: 'Full eternity band with 3 ct tw lab diamonds',
    priceUsd: 8_500,
    priceLbc: 8_500,
    imageEmoji: '✨',
    badge: 'Luxury',
  },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function formatLbc(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// AnimatedCounter
// ---------------------------------------------------------------------------

function AnimatedCounter({
  target,
  duration = 1200,
  prefix = '',
}: {
  target: number;
  duration?: number;
  prefix?: string;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);
  // Capture the starting value at the time the animation begins, without
  // making `displayed` a dependency (which would restart the animation each frame).
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = displayed;
    const start = performance.now();
    const initialValue = startValueRef.current;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(initialValue + (target - initialValue) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {formatLbc(displayed)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// WalletDashboard
// ---------------------------------------------------------------------------

export interface WalletDashboardProps {
  /** LBC Credit balance displayed at the top */
  lbcBalance?: number;
  /** Solana wallet address shown in the header */
  walletAddress?: string;
  /** Called when the user presses "Quick Pay" */
  onQuickPay?: () => void;
  /** Called when the user selects a marketplace item */
  onPurchase?: (item: MarketplaceItem) => void;
}

export default function WalletDashboard({
  lbcBalance = 12_450,
  walletAddress = '8xMq...3Fvp',
  onQuickPay,
  onPurchase,
}: WalletDashboardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3_000);
  }, []);

  const handleQuickPay = () => {
    if (onQuickPay) {
      onQuickPay();
    } else {
      showToast('⚡ Quick Pay initiated — Terry Fox Auto Center');
    }
  };

  const handlePurchase = (item: MarketplaceItem) => {
    if (onPurchase) {
      onPurchase(item);
    } else {
      showToast(`💍 Purchase initiated: ${item.name} — ${formatUsd(item.priceUsd)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      {/* Toast notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full
                     bg-cyan-500/90 text-white text-sm font-semibold shadow-lg
                     backdrop-blur-md transition-opacity duration-300"
        >
          {toastMessage}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------------------------------- */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <h1 className="text-xl font-bold tracking-wide">LBC Wallet</h1>
              <p className="text-xs text-gray-400">LBC Diamond Standard</p>
            </div>
          </div>
          <div
            className="text-xs text-gray-400 font-mono bg-white/5 border border-white/10
                          rounded-full px-4 py-1"
          >
            {walletAddress}
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Balance Card */}
        {/* ---------------------------------------------------------------- */}
        <section
          aria-label="LBC Credit balance"
          className="relative overflow-hidden rounded-2xl border border-cyan-500/30
                     bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-950/40
                     backdrop-blur-xl p-8 shadow-2xl"
        >
          {/* Decorative glow */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full
                          bg-cyan-500/10 blur-3xl"
          />

          <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">
            LBC Credit Balance
          </p>
          <p className="text-5xl md:text-6xl font-black tracking-tight text-white">
            <AnimatedCounter target={lbcBalance} />
            <span className="ml-2 text-2xl font-semibold text-cyan-400">LBC</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            ≈ {formatUsd(lbcBalance)} USD at current rate
          </p>

          {/* Quick Pay CTA */}
          <button
            type="button"
            onClick={handleQuickPay}
            className="mt-6 inline-flex items-center gap-2 rounded-full
                       bg-cyan-500 hover:bg-cyan-400 active:scale-95
                       px-8 py-3 text-sm font-bold text-gray-950
                       transition-all duration-200 shadow-lg shadow-cyan-500/30
                       focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2
                       focus:ring-offset-gray-900"
            aria-label="Quick Pay at Terry Fox Auto Center"
          >
            ⚡ Quick Pay
            <span className="text-xs font-normal opacity-70">Terry Fox Auto Center</span>
          </button>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Two-column grid: Marketplace + Transaction History */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* -------------------------------------------------------------- */}
          {/* Marketplace */}
          {/* -------------------------------------------------------------- */}
          <section
            aria-label="Lab Diamond Gold Ring marketplace"
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💍</span>
              <h2 className="font-bold text-base">Lab Diamond Collection</h2>
            </div>

            <ul className="space-y-3" role="list">
              {MARKETPLACE_ITEMS.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl
                             bg-white/5 border border-white/10 hover:border-cyan-500/50
                             p-4 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">{item.imageEmoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                      {item.badge && (
                        <span
                          className="inline-block mt-1 text-xs font-bold px-2 py-0.5
                                        rounded-full bg-cyan-500/20 text-cyan-400"
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-white">{formatUsd(item.priceUsd)}</p>
                    <p className="text-xs text-cyan-400">{formatLbc(item.priceLbc)} LBC</p>
                    <button
                      type="button"
                      onClick={() => handlePurchase(item)}
                      className="mt-2 text-xs px-3 py-1 rounded-full
                                 bg-white/10 hover:bg-cyan-500 hover:text-gray-950
                                 active:scale-95 transition-all duration-150
                                 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      aria-label={`Purchase ${item.name}`}
                    >
                      Buy
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* Transaction History */}
          {/* -------------------------------------------------------------- */}
          <section
            aria-label="Recent transactions"
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h2 className="font-bold text-base">Recent Transactions</h2>
            </div>

            <ul className="space-y-2" role="list">
              {MOCK_TRANSACTIONS.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl
                             bg-white/5 border border-white/10 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        tx.type === 'credit' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium leading-tight">{tx.description}</p>
                      <p className="text-xs text-gray-500">{timeAgo(tx.timestampIso)}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-bold shrink-0 ml-3 ${
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                    aria-label={`${tx.type === 'credit' ? 'Credit' : 'Debit'} ${formatLbc(tx.amountLbc)} LBC`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatLbc(tx.amountLbc)} LBC
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-center text-xs text-gray-500 pt-2">
              Showing 4 most recent · Zero-Gas ecosystem
            </p>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Market Data Bar */}
        {/* ---------------------------------------------------------------- */}
        <section
          aria-label="Live market data"
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4"
        >
          <div className="flex flex-wrap gap-6 items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-gray-400">LBC / USD</span>
              <span className="font-bold">$1.00</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">SOL / USD</span>
              <span className="font-bold">$148.32</span>
              <span className="text-emerald-400 text-xs">+2.4%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">24h Volume</span>
              <span className="font-bold">$1.2M</span>
            </div>
            <div className="ml-auto text-xs text-gray-500">
              Zero-Gas Network · Secured by Lumina Sentinel
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
