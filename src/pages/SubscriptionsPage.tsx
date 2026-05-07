import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUpgradeDialog } from "@/contexts/UpgradeDialog";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { youtube, type YTSearchItem } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CampaignBanner } from "@/components/CampaignBanner";
import { toast } from "sonner";
import { X, Search as SearchIcon, Plus, Check } from "lucide-react";

export default function SubscriptionsPage() {
  const { list, subscribe, unsubscribe, isSubscribed } = useSubscriptions();
  const { showUpgrade } = useUpgradeDialog();
  const { data: campaigns = [] } = useActiveCampaigns();
  const [discoverQuery, setDiscoverQuery] = useState("");

  useEffect(() => {
    document.title = "Channels · Tuubmix";
  }, []);

  const discover = useMutation({
    mutationFn: () => youtube.search(discoverQuery),
    onError: (e: Error) => toast.error(e.message),
  });

  const onDiscoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (discoverQuery.trim()) discover.mutate();
  };

  const discoveredChannels = (discover.data?.items ?? []).filter(
    (i) => i.id.kind === "youtube#channel",
  );
  const thumbOf = (item: YTSearchItem) =>
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url ??
    "";

  const handleSubscribe = (c: YTSearchItem) => {
    const channelId = c.id.channelId!;
    const payload = {
      channelId,
      channelTitle: c.snippet.title,
      channelThumbnail: thumbOf(c),
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 max-w-3xl">
        <h1 className="font-display text-2xl font-semibold mb-6">Your channels</h1>

        <CampaignBanner />

        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Discover</h2>
          <form onSubmit={onDiscoverSubmit} className="flex gap-2 mb-4">
            <Input
              value={discoverQuery}
              onChange={(e) => setDiscoverQuery(e.target.value)}
              placeholder="Search YouTube channels…"
              className="h-11"
            />
            <Button type="submit" disabled={discover.isPending}>
              <SearchIcon className="h-4 w-4 mr-2" />
              {discover.isPending ? "Searching…" : "Search"}
            </Button>
          </form>

          {discover.isSuccess && discoveredChannels.length === 0 && (
            <p className="text-muted-foreground">No channels found.</p>
          )}

          {discoveredChannels.length > 0 && (
            <ul className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
              {discoveredChannels.map((c) => {
                const channelId = c.id.channelId!;
                const subscribed = isSubscribed(channelId);
                return (
                  <li key={channelId}>
                    <div className="flex items-center gap-4 p-4">
                      <Link
                        to={`/channel/${channelId}`}
                        className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={thumbOf(c)}
                          alt={c.snippet.title}
                          className="h-12 w-12 rounded-full object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <h3 className="font-display text-lg truncate">{c.snippet.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {c.snippet.description}
                          </p>
                        </div>
                      </Link>
                      <Button
                        variant={subscribed ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          if (subscribed) {
                            unsubscribe.mutate(channelId, {
                              onSuccess: () => toast.success("Unsubscribed"),
                              onError: (err) => toast.error(err.message),
                            });
                          } else {
                            handleSubscribe(c);
                          }
                        }}
                      >
                        {subscribed ? (
                          <><Check className="h-4 w-4 mr-1" />Subscribed</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-1" />Subscribe</>
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {list.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground mb-2">No channels yet.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
            {(list.data ?? []).map((s) => (
              (() => {
                const campaign = campaigns.find((c) => c.channel_id === s.channel_id);
                return (
              <li key={s.id}>
                <Link
                  to={`/channel/${s.channel_id}`}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                >
                  {s.channel_thumbnail ? (
                    <img src={s.channel_thumbnail} alt={s.channel_title} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg truncate">{s.channel_title}</h3>
                    {s.expires_at ? (
                      <p className="text-xs text-primary mt-1">
                        Kampanjakanava · voimassa{" "}
                        {new Date(s.expires_at).toLocaleDateString("fi-FI")} asti
                      </p>
                    ) : campaign && (
                      <p className="text-xs text-primary mt-1">
                        Kampanjakanava · voimassa{" "}
                        {new Date(campaign.starts_at).toLocaleDateString("fi-FI")} –{" "}
                        {new Date(campaign.ends_at).toLocaleDateString("fi-FI")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      unsubscribe.mutate(s.channel_id, {
                        onSuccess: () => toast.success("Unsubscribed"),
                        onError: (err) => toast.error(err.message),
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Unsubscribe
                  </Button>
                </Link>
              </li>
                );
              })()
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}