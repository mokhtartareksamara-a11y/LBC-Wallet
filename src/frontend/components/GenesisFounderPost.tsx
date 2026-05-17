import React, { useState, useEffect, useRef } from 'react';

export interface GenesisPostProps {
  founderName: string;
  founderBio: string;
  founderAvatar: string;
  backgroundVideoUrl?: string;
  postCaption: string;
  timestamp: Date;
}

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6'];

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));
}

const FALLBACK_VIDEO_URL =
  'https://cdn.lbchub.com/genesis/lbc-hub-logo-animation.mp4';

const GenesisFounderPost: React.FC<GenesisPostProps> = ({
  founderName,
  founderBio,
  founderAvatar,
  backgroundVideoUrl = FALLBACK_VIDEO_URL,
  postCaption,
  timestamp,
}) => {
  const [likes, setLikes] = useState(12_847);
  const [liked, setLiked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [confettiParticles] = useState<ConfettiParticle[]>(() =>
    generateConfetti(60)
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Trigger fade-in after mount
    const fadeTimer = setTimeout(() => setVisible(true), 50);
    // Trigger confetti burst on first render
    const confettiTimer = setTimeout(() => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }, 600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(confettiTimer);
    };
  }, []);

  const handleLike = () => {
    if (liked) {
      setLikes((l) => l - 1);
    } else {
      setLikes((l) => l + 1);
    }
    setLiked((prev) => !prev);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `${founderName} - Genesis Post on LBC Hub`,
          text: postCaption,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        .catch(() => {
          /* share dismissed */
        });
    }
  };

  const formattedDate = timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article
      aria-label="Founder Genesis Post"
      className={`relative w-full min-h-screen overflow-hidden transition-opacity duration-[3000ms] ease-in ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* ── Confetti Layer ── */}
      {showConfetti && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
          {confettiParticles.map((p) => (
            <span
              key={p.id}
              className="absolute top-0 w-2 h-2 rounded-sm"
              style={{
                left: `${p.x}%`,
                backgroundColor: p.color,
                animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Background Video / Fallback ── */}
      <div className="absolute inset-0 -z-10">
        {!videoError ? (
          <video
            ref={videoRef}
            src={backgroundVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />
        )}
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70 backdrop-blur-[2px]" />
      </div>

      {/* ── Post Card ── */}
      <div className="relative z-10 flex justify-center items-start py-10 px-4">
        <div
          className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-yellow-400/30"
          style={{
            background: 'rgba(15, 10, 40, 0.72)',
            backdropFilter: 'blur(16px)',
            boxShadow:
              '0 0 0 1.5px rgba(251,191,36,0.3), 0 0 32px 4px rgba(139,92,246,0.25)',
          }}
        >
          {/* ── Genesis Badge Header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/50 px-3 py-1 text-xs font-semibold text-yellow-300 tracking-wide">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-yellow-400"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L10 13.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L2.82 7.124a.75.75 0 0 1 .416-1.28l4.21-.611L9.327 1.418A.75.75 0 0 1 10 1Z"
                  clipRule="evenodd"
                />
              </svg>
              Genesis Post · 1st Post on LBC Hub
            </span>
            <time
              dateTime={timestamp.toISOString()}
              className="text-xs text-purple-300/70"
            >
              {formattedDate}
            </time>
          </div>

          {/* ── Founder Profile Section ── */}
          <div className="flex flex-col items-center px-6 pb-4">
            <div className="relative mb-3">
              {/* Avatar */}
              <img
                src={founderAvatar}
                alt={`${founderName} profile photo`}
                width={120}
                height={120}
                className="w-28 h-28 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
                style={{ boxShadow: '0 0 20px 4px rgba(251,191,36,0.45)' }}
              />
              {/* Verified checkmark on avatar */}
              <span
                aria-label="Verified founder"
                className="absolute bottom-1 right-1 flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-indigo-900"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>

            {/* Name + verified badge */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {founderName}
              </h1>
              <span
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-0.5 text-xs font-bold text-indigo-900 animate-pulse"
                aria-label="Verified Founder"
              >
                ✅ Verified Founder
              </span>
            </div>

            <p className="mt-1 text-sm text-purple-200 text-center">
              {founderBio}
            </p>
            <p className="mt-0.5 text-xs text-yellow-300/70 font-medium">
              LBC Hub Founder · Platform Launch
            </p>
          </div>

          {/* ── Genesis Message Content ── */}
          <div className="px-6 pb-5">
            <div
              className="rounded-2xl p-4 text-sm leading-relaxed text-purple-100 whitespace-pre-line"
              style={{ background: 'rgba(139,92,246,0.08)' }}
            >
              {postCaption}
            </div>
          </div>

          {/* ── Interactive Elements ── */}
          <div className="flex items-center justify-between px-6 pb-6 gap-3">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              aria-pressed={liked}
              aria-label={`${liked ? 'Unlike' : 'Like'} this post. Currently ${likes.toLocaleString()} likes`}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                liked
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30'
                  : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={liked ? '0' : '1.5'}
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.046C4.363 12.498 3 10.78 3 8.5a5.5 5.5 0 0111 0c0 2.28-1.363 3.998-2.885 5.174a22.045 22.045 0 01-2.582 2.046 20.759 20.759 0 01-1.162.682l-.019.01-.005.003h-.002a.75.75 0 01-.69 0h-.002z" />
              </svg>
              {likes.toLocaleString()}
            </button>

            {/* Share with Genesis badge */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this Genesis Post"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                />
              </svg>
              Share · Genesis Post
            </button>

            {/* CTA Buttons */}
            <a
              href="/marketplace"
              className="rounded-full px-4 py-2 text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-900 hover:from-yellow-300 hover:to-amber-400 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              Explore
            </a>
          </div>
        </div>
      </div>

      {/* ── CSS keyframes injected via style tag ── */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </article>
  );
};

export default GenesisFounderPost;
