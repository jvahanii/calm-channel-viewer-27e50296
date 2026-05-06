import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Ctx = { showUpgrade: (onUpgraded?: () => void) => void };
const UpgradeCtx = createContext<Ctx | undefined>(undefined);

export function UpgradeDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [onUpgraded, setOnUpgraded] = useState<(() => void) | null>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const showUpgrade = useCallback((cb?: () => void) => {
    setOnUpgraded(() => cb ?? null);
    setOpen(true);
  }, []);

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
    await qc.invalidateQueries({ queryKey: ["user_tier", user.id] });
    toast.success("Welcome to Tuubmix Plus!");
    setOpen(false);
    onUpgraded?.();
  };

  return (
    <UpgradeCtx.Provider value={{ showUpgrade }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">Upgrade</span>
            </div>
            <DialogTitle className="font-display text-2xl">
              You've reached your channel limit.
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Tuubmix Free lets you follow one channel. Upgrade to{" "}
              <span className="font-medium text-foreground">Tuubmix Plus</span> for
              unlimited subscriptions — free during early access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={upgrading}>
              Maybe later
            </Button>
            <Button onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? "Upgrading…" : "Upgrade to Plus — free"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeCtx.Provider>
  );
}

export function useUpgradeDialog() {
  const ctx = useContext(UpgradeCtx);
  if (!ctx) throw new Error("useUpgradeDialog must be used within UpgradeDialogProvider");
  return ctx;
}