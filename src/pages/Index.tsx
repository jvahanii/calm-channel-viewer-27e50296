import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { type YTVideo, isShortVideo } from "@/lib/youtube";
import { useFeed } from "@/hooks/useFeed";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useHiddenVideos } from "@/contexts/HiddenVideos";
import { CampaignBanner } from "@/components/CampaignBanner";

export default function Index() {
  const { list } = useSubscriptions();
  const [active, setActive] = useState<YTVideo | null>(null);

  useEffect(() => {
    document.title = "Your feed · Tuubmix";
  }, []);

  const channelIds = (list.data ?? []).map((s) => s.channel_id);

  const feed = useFeed(channelIds);
  const { hiddenIds, showHidden, hideShorts, shortsLimit } = useHiddenVideos();
  const showingHiddenOnly = showHidden && hiddenIds.size > 0;
  const visibleItems = (showHidden
    ? feed.items.filter((v) => hiddenIds.has(v.videoId))
    : feed.items.filter((v) => !hiddenIds.has(v.videoId))
  ).filter((v) => !hideShorts || !isShortVideo(v.duration, shortsLimit * 60));

  const allHiddenLoaded =
    showHidden && hiddenIds.size > 0 && visibleItems.length >= hiddenIds.size;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          feed.hasMore &&
          !feed.isLoading &&
          !feed.isInitialLoading &&
          !(showHidden && hiddenIds.size === 0) &&
          !allHiddenLoaded
        ) {
          feed.loadMore();
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [feed.hasMore, feed.isLoading, feed.isInitialLoading, feed.loadMore, showHidden, hiddenIds.size, allHiddenLoaded]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-3">Your feed</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
            The latest from the channels you actually care about.
          </h1>
        </div>

        <CampaignBanner />

        {list.isLoading ? (
          <p className="text-muted-foreground">Loading subscriptions…</p>
        ) : channelIds.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center">
            <h2 className="font-display text-2xl mb-2">No subscriptions yet</h2>
            <p className="text-muted-foreground mb-6">Find channels to follow and your feed will fill up here.</p>
            <Button asChild>
              <Link to="/search"><Search className="h-4 w-4 mr-2" />Search YouTube</Link>
            </Button>
          </div>
        ) : feed.isInitialLoading && feed.items.length === 0 ? (
          <p className="text-muted-foreground">Fetching latest videos…</p>
        ) : feed.error ? (
          <p className="text-destructive">Could not load videos. Make sure YOUTUBE_API_KEY is set.</p>
        ) : showHidden && hiddenIds.size === 0 ? (
          <p className="text-muted-foreground">No hidden videos.</p>
        ) : showHidden && visibleItems.length === 0 && !feed.isLoading && !feed.isInitialLoading ? (
          <p className="text-muted-foreground">
            No hidden videos in the current feed window. Load more or turn off "Show hidden".
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {visibleItems.map((v) => (
                <VideoCard key={`${v.channelId}-${v.videoId}`} video={v} onPlay={setActive} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-12" />
            {feed.isLoading && (
              <p className="text-center text-muted-foreground py-6">Loading more…</p>
            )}
            {!feed.hasMore && feed.items.length > 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">
                You've reached the end.
              </p>
            )}
          </>
        )}
      </main>

      <VideoPlayer
        videoId={active?.videoId ?? null}
        title={active?.title}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
