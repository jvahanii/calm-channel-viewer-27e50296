import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier } from "@/hooks/useUserTier";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AccountPage() {
  const { user } = useAuth();
  const { tier, isPlus, isLoading } = useUserTier();
  const { list } = useSubscriptions();
  const qc = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [keepId, setKeepId] = useState<string>("");

  useEffect(() => {
    document.title = "Account · Tuubmix";
  }, []);

  const count = list.data?.length ?? 0;
  const limit = isPlus ? "Unlimited" : "1";

  const handleUpgrade = async () => {
    if (!user) return;
    setUpgrading(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "plus" });
    setUpgrading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to Tuubmix Plus!");
    qc.invalidateQueries({ queryKey: ["user_tier", user.id] });
  };

  const openDowngrade = () => {
    setKeepId(list.data?.[0]?.channel_id ?? "");
    setDowngradeOpen(true);
  };

  const handleDowngrade = async () => {
    if (!user) return;
    setDowngrading(true);
    try {
      // If more than one subscription, drop all but the chosen one
      if ((list.data?.length ?? 0) > 1 && keepId) {
        const { error: delSubErr } = await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .neq("channel_id", keepId);
        if (delSubErr) throw delSubErr;
      }
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("role", "plus");
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["user_tier", user.id] }),
        qc.invalidateQueries({ queryKey: ["subscriptions", user.id] }),
      ]);
      toast.success("Switched to Tuubmix Free.");
      setDowngradeOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 max-w-2xl">
        <p className="text-sm text-muted-foreground uppercase tracking-widest mb-3">Account</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-10">
          Your plan.
        </h1>

        <div className="border border-border rounded-2xl p-8 bg-card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Signed in as</p>
              <p className="font-display text-lg">{user?.email}</p>
            </div>
            <Badge
              variant={isPlus ? "default" : "secondary"}
              className="uppercase tracking-wider text-xs px-3 py-1"
            >
              {isLoading ? "…" : `Tuubmix ${tier}`}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Channels</p>
              <p className="font-display text-2xl">{count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Limit</p>
              <p className="font-display text-2xl">{limit}</p>
            </div>
          </div>
        </div>

        {!isPlus && (
          <div className="border border-primary/30 rounded-2xl p-8 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs text-primary uppercase tracking-widest">Upgrade</p>
            </div>
            <h2 className="font-display text-2xl mb-2">Go unlimited with Tuubmix Plus.</h2>
            <p className="text-muted-foreground mb-5">
              Subscribe to as many channels as you like. No limits.
            </p>
            <Button onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? "Upgrading…" : "Upgrade to Plus — free"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Free during early access. Payments coming soon.
            </p>
          </div>
        )}

        {isPlus && (
          <div className="border border-border rounded-2xl p-8 bg-card">
            <h2 className="font-display text-xl mb-2">Switch back to Free</h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Free accounts can keep only one channel subscription.
            </p>
            <Button variant="outline" onClick={openDowngrade}>
              <ArrowDown className="h-4 w-4 mr-1" />
              Downgrade to Free
            </Button>
          </div>
        )}

        <AlertDialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Downgrade to Tuubmix Free?</AlertDialogTitle>
              <AlertDialogDescription>
                {count > 1
                  ? `You have ${count} channel subscriptions. Free accounts can keep only one — choose which to keep. The rest will be removed.`
                  : count === 1
                    ? "Your single subscription will be kept."
                    : "You have no subscriptions to keep."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {count > 1 && (
              <div className="py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Keep this channel</p>
                <Select value={keepId} onValueChange={setKeepId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {list.data?.map((s) => (
                      <SelectItem key={s.channel_id} value={s.channel_id}>
                        {s.channel_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={downgrading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDowngrade();
                }}
                disabled={downgrading || (count > 1 && !keepId)}
              >
                {downgrading ? "Downgrading…" : "Confirm downgrade"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}