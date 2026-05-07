import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserTier } from "@/hooks/useUserTier";
import { LogOut, EyeOff, Sparkles, BookOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHiddenVideos } from "@/contexts/HiddenVideos";

export function Header() {
  const { user, signOut } = useAuth();
  const { tier, isPlus, isSuperuser } = useUserTier();
  const { showHidden, setShowHidden, list } = useHiddenVideos();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${
      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tuubmix<span className="text-primary">.</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-7">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/subscriptions" className={linkClass}>Channels</NavLink>
            <NavLink to="/account" className={linkClass}>Account</NavLink>
            <NavLink to="/guide" className={linkClass}>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />Guide
              </span>
            </NavLink>
            {isSuperuser && (
              <NavLink to="/admin" className={linkClass}>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />Admin
                </span>
              </NavLink>
            )}
            <div className="flex items-center gap-2" title="Show hidden videos">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={setShowHidden}
                aria-label="Show hidden videos"
              />
              <Label htmlFor="show-hidden" className="text-xs text-muted-foreground cursor-pointer">
                Hidden{list.length > 0 ? ` (${list.length})` : ""}
              </Label>
            </div>
            <Badge
              variant={isPlus ? "default" : "secondary"}
              className="uppercase tracking-wider text-[10px]"
            >
              {tier}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}