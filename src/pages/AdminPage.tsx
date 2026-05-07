import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, Search, Trash2, Power, PowerOff } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUserTier } from "@/hooks/useUserTier";
import { useAuth } from "@/contexts/AuthContext";
import { useAllCampaigns } from "@/hooks/useCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { youtube } from "@/lib/youtube";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type ChannelPick = {
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
};

export default function AdminPage() {
  const { user } = useAuth();
  const { isSuperuser, isLoading } = useUserTier();
  const { data: campaigns = [], refetch } = useAllCampaigns();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<"free" | "all">("free");
  const [startsAt, setStartsAt] = useState<Date>(new Date());
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [subscriptionDays, setSubscriptionDays] = useState<string>("30");
  const [channel, setChannel] = useState<ChannelPick | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ChannelPick[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Admin · Tuubmix";
  }, []);

  if (isLoading) return null;
  if (!user || !isSuperuser) return <Navigate to="/" replace />;

  const onSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const r = await youtube.search(search);
      const picks = r.items
        .filter((i) => i.id.kind === "youtube#channel" && i.id.channelId)
        .map((i) => ({
          channel_id: i.id.channelId!,
          channel_title: i.snippet.title,
          channel_thumbnail:
            i.snippet.thumbnails.high?.url ??
            i.snippet.thumbnails.medium?.url ??
            i.snippet.thumbnails.default?.url ??
            null,
        }));
      setResults(picks);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setAudience("free");
    setStartsAt(new Date());
    setEndsAt(undefined);
    setSubscriptionDays("30");
    setChannel(null);
    setSearch("");
    setResults([]);
  };

  const onCreate = async () => {
    if (!channel) return toast.error("Pick a channel");
    if (!endsAt) return toast.error("Pick an end date");
    if (!title.trim()) return toast.error("Title is required");
    const days = subscriptionDays.trim() === "" ? null : Number(subscriptionDays);
    if (days !== null && (!Number.isFinite(days) || days <= 0)) {
      return toast.error("Subscription days must be a positive number");
    }
    setSaving(true);
    const { error } = await supabase.from("campaigns").insert({
      created_by: user.id,
      channel_id: channel.channel_id,
      channel_title: channel.channel_title,
      channel_thumbnail: channel.channel_thumbnail,
      title: title.trim(),
      description: description.trim() || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      audience,
      is_active: true,
      subscription_days: days,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Campaign created");
    reset();
    qc.invalidateQueries({ queryKey: ["campaigns"] });
    refetch();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("campaigns")
      .update({ is_active: !active })
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["campaigns"] });
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["campaigns"] });
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 max-w-5xl">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Superuser
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
            Campaigns.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Offer a featured channel for free during a limited window. Free users can
            subscribe to it without using their 1-channel quota.
          </p>
        </div>

        {/* Create form */}
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-12">
          <h2 className="font-display text-2xl mb-6">New campaign</h2>

          <div className="space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Channel
              </Label>
              {channel ? (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-border">
                  {channel.channel_thumbnail && (
                    <img src={channel.channel_thumbnail} alt="" className="h-10 w-10 rounded-full" />
                  )}
                  <span className="flex-1 font-medium">{channel.channel_title}</span>
                  <Button variant="ghost" size="sm" onClick={() => setChannel(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search YouTube channel…"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onSearch())}
                    />
                    <Button type="button" onClick={onSearch} disabled={searching}>
                      <Search className="h-4 w-4 mr-1" /> {searching ? "…" : "Search"}
                    </Button>
                  </div>
                  {results.length > 0 && (
                    <div className="mt-3 grid gap-2 max-h-72 overflow-y-auto">
                      {results.map((r) => (
                        <button
                          key={r.channel_id}
                          onClick={() => { setChannel(r); setResults([]); }}
                          className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted text-left"
                        >
                          {r.channel_thumbnail && (
                            <img src={r.channel_thumbnail} alt="" className="h-9 w-9 rounded-full" />
                          )}
                          <span className="font-medium">{r.channel_title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <Label htmlFor="ct">Title</Label>
              <Input
                id="ct"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discover this week's featured creator"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cd">Description</Label>
              <Textarea
                id="cd"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why your audience should care…"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Starts</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start font-normal")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(startsAt, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startsAt} onSelect={(d) => d && setStartsAt(d)} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Ends</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start font-normal", !endsAt && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {endsAt ? format(endsAt, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as "free" | "all")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free users only</SelectItem>
                    <SelectItem value="all">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={onCreate} disabled={saving}>
                {saving ? "Creating…" : "Create campaign"}
              </Button>
              <Button variant="ghost" onClick={reset}>Reset</Button>
            </div>
          </div>
        </section>

        {/* List */}
        <section>
          <h2 className="font-display text-2xl mb-5">All campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground">No campaigns yet.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const now = Date.now();
                const live = c.is_active && new Date(c.starts_at).getTime() <= now && new Date(c.ends_at).getTime() >= now;
                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    {c.channel_thumbnail && (
                      <img src={c.channel_thumbnail} alt="" className="h-12 w-12 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-lg truncate">{c.title}</h3>
                        {live ? (
                          <Badge>Live</Badge>
                        ) : (
                          <Badge variant="secondary">{c.is_active ? "Scheduled/Ended" : "Inactive"}</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] uppercase">{c.audience}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.channel_title} · {format(new Date(c.starts_at), "MMM d")} → {format(new Date(c.ends_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(c.id, c.is_active)}>
                      {c.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}