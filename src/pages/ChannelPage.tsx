import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { youtube, type YTVideo } from "@/lib/youtube";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUpgradeDialog } from "@/contexts/UpgradeDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";
import { useHiddenVideos } from "@/contexts/HiddenVideos";

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [active, setActive] = useState<YTVideo | null>(null);
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions();
  const { showUpgrade } = useUpgradeDialog();

  const info = useQuery({
    queryKey: ["channelInfo", channelId],
    enabled: !!channelId,
    queryFn: () => youtube.channelInfo(channelId!),
  });

  const videos = useInfiniteQuery({
    queryKey: ["channelVideos", channelId],
    enabled: !!channelId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => youtube.channelVideos(channelId!, pageParam, 24),
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          videos.hasNextPage &&
          !videos.isFetchingNextPage
        ) {
          videos.fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [videos.hasNextPage, videos.isFetchingNextPage, videos.fetchNextPage, videos]);

  const allVideos = videos.data?.pages.flatMap((p) => p.items) ?? [];
  const { hiddenIds, showHidden } = useHiddenVideos();
  const visibleVideos = showHidden ? allVideos : allVideos.filter((v) => !hiddenIds.has(v.videoId));

  const ch = info.data?.items?.[0];

  useEffect(() => {
    document.title = ch ? `${ch.snippet.title} · Tuubmix` : "Channel · Tuubmix";
  }, [ch]);

  const subscribed = channelId ? isSubscribed(channelId) : false;
  const thumb = ch?.snippet.thumbnails.high?.url ?? ch?.snippet.thumbnails.medium?.url ?? ch?.snippet.thumbnails.default?.url;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {info.isLoading ? (
          <p className="text-muted-foreground">Loading channel…</p>
        ) : ch ? (
          <div className="flex items-start gap-6 mb-12">
            {thumb && <img src={thumb} alt={ch.snippet.title} className="h-24 w-24 rounded-full object-cover shadow-soft" />}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">{ch.snippet.title}</h1>
              <p className="text-muted-foreground mb-4 max-w-2xl line-clamp-2">{ch.snippet.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                {ch.statistics.subscriberCount && <span>{Number(ch.statistics.subscriberCount).toLocaleString()} subscribers</span>}
                {ch.statistics.videoCount && <span>{Number(ch.statistics.videoCount).toLocaleString()} videos</span>}
              </div>
              <Button
                variant={subscribed ? "outline" : "default"}
                onClick={() => {
                  if (!channelId) return;
                  if (subscribed) {
                    unsubscribe.mutate(channelId, {
                      onSuccess: () => toast.success("Unsubscribed"),
                    });
                  } else {
                    const payload = {
                      channelId,
                      channelTitle: ch.snippet.title,
                      channelThumbnail: thumb ?? null,
                    };
                    subscribe.mutate(payload, {
                      onSuccess: () => toast.success(`Subscribed to ${ch.snippet.title}`),
                      onError: (e) => {
                        if (e.message.includes("Tuubmix Free")) {
                          showUpgrade(() => {
                            subscribe.mutate(payload, {
                              onSuccess: () => toast.success(`Subscribed to ${ch.snippet.title}`),
                              onError: (err) => toast.error(err.message),
                            });
                          });
                        } else toast.error(e.message);
                      },
                    });
                  }
                }}
              >
                {subscribed ? <><Check className="h-4 w-4 mr-1" />Subscribed</> : <><Plus className="h-4 w-4 mr-1" />Subscribe</>}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-destructive mb-8">Channel not found.</p>
        )}

        {videos.isLoading ? (
          <p className="text-muted-foreground">Loading videos…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {visibleVideos.map((v) => (
                <VideoCard key={v.videoId} video={v} onPlay={setActive} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-12" />
            {videos.isFetchingNextPage && (
              <p className="text-center text-muted-foreground py-6">Loading more…</p>
            )}
            {!videos.hasNextPage && allVideos.length > 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">
                You've reached the end.
              </p>
            )}
          </>
        )}
      </main>

      <VideoPlayer videoId={active?.videoId ?? null} title={active?.title} onClose={() => setActive(null)} />
    </div>
  );
}