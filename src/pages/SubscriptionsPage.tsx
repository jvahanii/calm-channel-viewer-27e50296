import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, Search as SearchIcon } from "lucide-react";

export default function SubscriptionsPage() {
  const { list, unsubscribe } = useSubscriptions();
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Channels · Tuubmix";
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list.data ?? [];
    return (list.data ?? []).filter((s) =>
      s.channel_title.toLowerCase().includes(q),
    );
  }, [list.data, query]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 max-w-3xl">
        <p className="text-sm text-muted-foreground uppercase tracking-widest mb-3">Channels</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
          Your subscriptions.
        </h1>

        {(list.data?.length ?? 0) > 0 && (
          <div className="relative mb-8">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your channels…"
              className="h-11 pl-9"
            />
          </div>
        )}

        {list.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-10 text-center">
            <p className="text-muted-foreground mb-5">No channels yet.</p>
            <Button asChild>
              <Link to="/search"><Search className="h-4 w-4 mr-2" />Find channels</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No channels match "{query}".</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
            {filtered.map((s) => (
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
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}