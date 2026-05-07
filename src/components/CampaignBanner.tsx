import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUserTier } from "@/hooks/useUserTier";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function CampaignBanner() {
  const { data: campaigns = [] } = useActiveCampaigns();
  const { tier } = useUserTier();
  const { subscribe, isSubscribed } = useSubscriptions();
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setDismissed(JSON.parse(sessionStorage.getItem("dismissed_campaigns") || "{}"));
    } catch { /* noop */ }
  }, []);

  const visible = campaigns.filter((c) => {
    if (dismissed[c.id]) return false;
    if (c.audience === "free" && tier !== "free") return false;
    return !isSubscribed(c.channel_id);
  });

  if (visible.length === 0) return null;

  const dismissOne = (id: string) => {
    const next = { ...dismissed, [id]: true };
    setDismissed(next);
    sessionStorage.setItem("dismissed_campaigns", JSON.stringify(next));
  };

  return (
    <div className="mb-8 space-y-4">
      {visible.map((c) => (
    <div key={c.id} className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 sm:p-8">
      <button
        onClick={() => dismissOne(c.id)}
        className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:bg-background/50 hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {c.channel_thumbnail && (
          <img src={c.channel_thumbnail} alt={c.channel_title} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Limited campaign
          </div>
          <h3 className="font-display text-xl sm:text-2xl mb-1">{c.title}</h3>
          {c.description && <p className="text-sm text-muted-foreground mb-4">{c.description}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              onClick={() =>
                subscribe.mutate(
                  {
                    channelId: c.channel_id,
                    channelTitle: c.channel_title,
                    channelThumbnail: c.channel_thumbnail,
                  },
                  {
                    onSuccess: () => toast.success(`Added ${c.channel_title} for free`),
                    onError: (e) => toast.error(e.message),
                  },
                )
              }
            >
              Add {c.channel_title} free
            </Button>
            <Link to={`/channel/${c.channel_id}`} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Preview channel
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Voimassa {new Date(c.starts_at).toLocaleDateString('fi-FI')} – {new Date(c.ends_at).toLocaleDateString('fi-FI')}
            </span>
            {c.subscription_days && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Tilaus {c.subscription_days} päivää
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
      ))}
    </div>
  );
}