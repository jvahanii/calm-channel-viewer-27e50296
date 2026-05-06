import { useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier } from "@/hooks/useUserTier";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const { user } = useAuth();
  const { tier, isPlus, isLoading } = useUserTier();
  const { list } = useSubscriptions();

  useEffect(() => {
    document.title = "Account · Tuubmix";
  }, []);

  const count = list.data?.length ?? 0;
  const limit = isPlus ? "Unlimited" : "1";

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
            <Button onClick={() => toast.info("Plus payments coming soon.")}>
              Upgrade to Plus
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}