import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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

type Ctx = { showUpgrade: () => void };
const UpgradeCtx = createContext<Ctx | undefined>(undefined);

export function UpgradeDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const showUpgrade = useCallback(() => setOpen(true), []);

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
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Maybe later
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                navigate("/account");
              }}
            >
              Upgrade to Plus
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