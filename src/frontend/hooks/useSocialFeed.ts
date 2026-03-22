import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import {
  FeedFilter,
  FeedPage,
  FeedQueryParams,
  LikePostPayload,
  SocialBridgeEvent,
  SocialPost,
  UseSocialFeedReturn,
} from '../types/socialFeedTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_PAGE_SIZE = 10;
const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';
const FEED_QUERY_KEY = 'socialFeed';

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchFeedPage(params: FeedQueryParams): Promise<FeedPage> {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.filter && params.filter !== FeedFilter.All) {
    query.set('filter', params.filter);
  }

  const res = await fetch(`/api/social/feed?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<FeedPage>;
}

async function likePostRequest(payload: LikePostPayload): Promise<void> {
  const res = await fetch(`/api/social/posts/${payload.postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked: payload.liked }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update like: ${res.status}`);
  }
}

// ─── useSocialFeed hook ───────────────────────────────────────────────────────

/**
 * Custom React hook that manages the Social Feed.
 *
 * Features:
 * - Paginated fetch from `/api/social/feed` via React Query's infinite query
 * - Real-time updates via Socket.IO WebSocket connection
 * - Filter by post type (all, purchases, achievements, travels)
 * - Optimistic like/unlike toggle
 * - Social Bridge event subscription for verified purchases
 */
export function useSocialFeed(): UseSocialFeedReturn {
  const queryClient = useQueryClient();
  const [filter, setFilterState] = useState<FeedFilter>(FeedFilter.All);
  const socketRef = useRef<Socket | null>(null);

  // ─── Infinite query ──────────────────────────────────────────────────────

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery<FeedPage, Error>({
    queryKey: [FEED_QUERY_KEY, filter],
    queryFn: ({ pageParam }) =>
      fetchFeedPage({
        cursor: pageParam as string | undefined,
        limit: FEED_PAGE_SIZE,
        filter,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });

  // ─── Derived flat post list ──────────────────────────────────────────────

  const posts: SocialPost[] = data?.pages.flatMap((page) => page.posts) ?? [];

  // ─── Optimistic like mutation ────────────────────────────────────────────

  const likeMutation = useMutation<void, Error, LikePostPayload>({
    mutationFn: likePostRequest,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: [FEED_QUERY_KEY, filter] });

      const previous = queryClient.getQueryData([FEED_QUERY_KEY, filter]);

      queryClient.setQueryData(
        [FEED_QUERY_KEY, filter],
        (old: typeof data) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) => {
                if (post.id !== payload.postId) return post;
                return {
                  ...post,
                  likedByMe: payload.liked,
                  likes: payload.liked ? post.likes + 1 : post.likes - 1,
                };
              }),
            })),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context && (context as { previous: unknown }).previous !== undefined) {
        queryClient.setQueryData(
          [FEED_QUERY_KEY, filter],
          (context as { previous: unknown }).previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY, filter] });
    },
  });

  // ─── WebSocket / Social Bridge ───────────────────────────────────────────

  useEffect(() => {
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Subscribe to Social Bridge events
      socket.emit('subscribe', { channel: 'social.feed' });
    });

    socket.on('social.post.published', (event: SocialBridgeEvent) => {
      prependPost(event.payload);
    });

    socket.on('social.post.liked', (event: SocialBridgeEvent) => {
      updatePost(event.payload);
    });

    socket.on('social.post.commented', (event: SocialBridgeEvent) => {
      updatePost(event.payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // The WebSocket connection is intentionally initialised once on mount and
    // must not reconnect on every render cycle. prependPost/updatePost are
    // stable callbacks defined after this effect, so they are accessed via
    // closure rather than as dependencies to keep a single persistent socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Prepend a newly-published post to the top of every cached page group
   * that matches the current filter.
   */
  const prependPost = useCallback(
    (newPost: SocialPost) => {
      queryClient.setQueryData(
        [FEED_QUERY_KEY, filter],
        (old: typeof data) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          // Avoid duplicates
          if (firstPage.posts.some((p) => p.id === newPost.id)) return old;
          return {
            ...old,
            pages: [
              { ...firstPage, posts: [newPost, ...firstPage.posts] },
              ...rest,
            ],
          };
        }
      );
    },
    [filter, queryClient]
  );

  /** Update an existing post in the cache (e.g. new like/comment count). */
  const updatePost = useCallback(
    (updated: SocialPost) => {
      queryClient.setQueryData(
        [FEED_QUERY_KEY, filter],
        (old: typeof data) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === updated.id ? updated : post
              ),
            })),
          };
        }
      );
    },
    [filter, queryClient]
  );

  // ─── Public API ───────────────────────────────────────────────────────────

  const setFilter = useCallback((newFilter: FeedFilter) => {
    setFilterState(newFilter);
  }, []);

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const likePost = useCallback(
    (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      likeMutation.mutate({ postId, liked: !post.likedByMe });
    },
    [likeMutation, posts]
  );

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    posts,
    filter,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    error: error?.message ?? null,
    setFilter,
    fetchMore,
    likePost,
    refresh,
  };
}
