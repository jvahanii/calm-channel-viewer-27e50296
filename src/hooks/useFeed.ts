import { useCallback, useEffect, useRef, useState } from "react";
import { youtube, type YTVideo } from "@/lib/youtube";

type ChannelState = {
  buffer: YTVideo[];
  nextPageToken: string | null | undefined; // undefined = not started, null = exhausted
};

const PAGE_SIZE = 15;
const EMIT_BATCH = 24;

export function useFeed(channelIds: string[]) {
  const [emitted, setEmitted] = useState<YTVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [done, setDone] = useState(false);

  const stateRef = useRef<Map<string, ChannelState>>(new Map());
  const idsKey = channelIds.slice().sort().join(",");
  const inFlightRef = useRef(false);

  // Reset whenever the set of channels changes
  useEffect(() => {
    stateRef.current = new Map(
      channelIds.map((id) => [id, { buffer: [], nextPageToken: undefined }]),
    );
    setEmitted([]);
    setDone(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || done || channelIds.length === 0) return;
    inFlightRef.current = true;
    const initial = emitted.length === 0;
    if (initial) setIsInitialLoading(true);
    else setIsLoading(true);

    try {
      const states = stateRef.current;

      // Fetch one page for any channel whose buffer is empty and not exhausted
      const fetches: Promise<void>[] = [];
      for (const id of channelIds) {
        const s = states.get(id) ?? { buffer: [], nextPageToken: undefined };
        states.set(id, s);
        if (s.buffer.length === 0 && s.nextPageToken !== null) {
          fetches.push(
            youtube
              .channelVideos(id, s.nextPageToken ?? undefined, PAGE_SIZE)
              .then((res) => {
                s.buffer.push(...res.items);
                s.nextPageToken = res.nextPageToken ?? null;
              })
              .catch((e) => {
                console.error("channel fetch failed", id, e);
                s.nextPageToken = null;
              }),
          );
        }
      }
      await Promise.all(fetches);

      // K-way merge with safe cutoff: only emit items newer than the
      // newest possible item still hidden in any non-exhausted channel.
      // For non-exhausted channels with a non-empty buffer, the next item
      // they could yield (next page) is older than the buffer's last item.
      // So cutoff = max over non-exhausted channels of "next possible ts":
      //   - if buffer empty (and not exhausted) → +Infinity (must wait)
      //   - else → timestamp of last buffered item (next page is older)
      let cutoff = -Infinity;
      let blocked = false;
      for (const id of channelIds) {
        const s = states.get(id)!;
        if (s.nextPageToken === null) continue; // exhausted contributes nothing
        if (s.buffer.length === 0) {
          blocked = true;
          break;
        }
        const lastTs = new Date(s.buffer[s.buffer.length - 1].publishedAt).getTime();
        if (lastTs > cutoff) cutoff = lastTs;
      }

      let merged: YTVideo[] = [];
      const allExhausted = channelIds.every(
        (id) => states.get(id)!.nextPageToken === null,
      );

      if (blocked && !allExhausted) {
        // Shouldn't happen because we just fetched, but guard anyway
        return;
      }

      // Collect candidates from each buffer
      const ready: YTVideo[] = [];
      for (const id of channelIds) {
        const s = states.get(id)!;
        if (allExhausted) {
          ready.push(...s.buffer);
          s.buffer = [];
        } else {
          const keep: YTVideo[] = [];
          for (const v of s.buffer) {
            const t = new Date(v.publishedAt).getTime();
            if (t >= cutoff) ready.push(v);
            else keep.push(v);
          }
          s.buffer = keep;
        }
      }

      ready.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );

      merged = ready;

      if (merged.length > 0) {
        setEmitted((prev) => {
          const seen = new Set(prev.map((v) => v.videoId));
          const additions = merged.filter((v) => !seen.has(v.videoId));
          // Trim per call to avoid mega-batches; remaining stays in buffers
          // but we already sorted so just append.
          if (additions.length > EMIT_BATCH) {
            const overflow = additions.splice(EMIT_BATCH);
            // Push overflow back into a synthetic buffer entry on the
            // first channel — simpler: re-bucket by channelId.
            for (const v of overflow) {
              const s = states.get(v.channelId);
              if (s) s.buffer.unshift(v);
            }
          }
          return [...prev, ...additions];
        });
      }

      if (allExhausted && Array.from(states.values()).every((s) => s.buffer.length === 0)) {
        setDone(true);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [channelIds, done, emitted.length]);

  // Initial load
  useEffect(() => {
    if (channelIds.length > 0 && emitted.length === 0 && !done) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return {
    items: emitted,
    loadMore,
    isLoading,
    isInitialLoading,
    hasMore: !done,
    error,
  };
}