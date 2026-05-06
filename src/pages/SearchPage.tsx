import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { youtube, type YTSearchItem, timeAgo } from "@/lib/youtube";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUpgradeDialog } from "@/contexts/UpgradeDialog";
import { toast } from "sonner";
import { Play, Plus, Check, Search as SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<{ videoId: string; title: string } | null>(null);
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions();
  const { showUpgrade } = useUpgradeDialog();

  useEffect(() => {
    document.title = "Search · Tuubmix";
  }, []);

  const search = useMutation({
    mutationFn: () => youtube.search(q),
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) search.mutate();
  };

  const channels = (search.data?.items ?? []).filter((i) => i.id.kind === "youtube#channel");
  const videos = (search.data?.items ?? []).filter((i) => i.id.kind === "youtube#video");

  const thumb = (item: YTSearchItem) =>
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url ??
    "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-2xl mb-10">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-3">Discover</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
            Find a channel worth following.
          </h1>
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search channels and videos…"
              className="h-12 text-base"
            />
            <Button type="submit" size="lg" disabled={search.isPending}>
              <SearchIcon className="h-4 w-4 mr-2" />
              {search.isPending ? "Searching…" : "Search"}
            </Button>
          </form>
        </div>

        {channels.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-5">Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((c) => {
                const channelId = c.id.channelId!;
                const subscribed = isSubscribed(channelId);
                return (
                  <div key={channelId} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card transition-shadow">
                    <Link to={`/channel/${channelId}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <img src={thumb(c)} alt={c.snippet.title} className="h-14 w-14 rounded-full object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <h3 className="font-display text-lg truncate">{c.snippet.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{c.snippet.description}</p>
                      </div>
                    </Link>
                    <Button
                      variant={subscribed ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        if (subscribed) {
                          unsubscribe.mutate(channelId, {
                            onSuccess: () => toast.success("Unsubscribed"),
                            onError: (e) => toast.error(e.message),
                          });
                        } else {
                          const payload = {
                            channelId,
                            channelTitle: c.snippet.title,
                            channelThumbnail: thumb(c),
                          };
                          subscribe.mutate(payload, {
                            onSuccess: () => toast.success(`Subscribed to ${c.snippet.title}`),
                            onError: (e) => {
                              if (e.message.includes("Tuubmix Free")) {
                                showUpgrade(() => {
                                  subscribe.mutate(payload, {
                                    onSuccess: () => toast.success(`Subscribed to ${c.snippet.title}`),
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
                );
              })}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-5">Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {videos.map((v) => {
                const vid = v.id.videoId!;
                return (
                  <div key={vid} className="group flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setActive({ videoId: vid, title: v.snippet.title })}
                      className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img src={thumb(v)} alt={v.snippet.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/95 p-3 shadow-soft">
                          <Play className="h-5 w-5 text-primary fill-primary" />
                        </div>
                      </div>
                    </button>
                    <div className="px-1">
                      <h3 className="font-display text-base leading-snug line-clamp-2">{v.snippet.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {v.snippet.channelTitle} · {timeAgo(v.snippet.publishedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {search.isSuccess && channels.length === 0 && videos.length === 0 && (
          <p className="text-muted-foreground">No results.</p>
        )}
      </main>

      <VideoPlayer videoId={active?.videoId ?? null} title={active?.title} onClose={() => setActive(null)} />
    </div>
  );
}