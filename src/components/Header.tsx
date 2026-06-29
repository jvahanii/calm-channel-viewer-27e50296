import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserTier } from "@/hooks/useUserTier";
import { LogOut, EyeOff, Sparkles, BookOpen, Menu, Timer, Bookmark } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useHiddenVideos } from "@/contexts/HiddenVideos";
import { useSavedVideos } from "@/contexts/SavedVideos";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const { tier, isPlus, isSuperuser } = useUserTier();
  const { showHidden, setShowHidden, hideShorts, setHideShorts, shortsLimit, setShortsLimit, list } = useHiddenVideos();
  const { showSavedInFeed, setShowSavedInFeed, list: savedList } = useSavedVideos();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${
      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-base py-2 transition-colors ${
      isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
    }`;

  const closeAnd = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tuubmix<span className="text-primary">.</span>
        </Link>
        {user && (
          <>
          {/* Mobile: menu only (hidden toggle lives inside the sheet) */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    Menu
                    <Badge
                      variant={isPlus ? "default" : "secondary"}
                      className="uppercase tracking-wider text-[10px]"
                    >
                      {tier}
                    </Badge>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col mt-6">
                  <SheetClose asChild>
                    <NavLink to="/" end className={mobileLinkClass}>Home</NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/subscriptions" className={mobileLinkClass}>Channels</NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/saved" className={mobileLinkClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <Bookmark className="h-4 w-4" />Saved
                      </span>
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/account" className={mobileLinkClass}>Account</NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/guide" className={mobileLinkClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />Guide
                      </span>
                    </NavLink>
                  </SheetClose>
                  {isSuperuser && (
                    <SheetClose asChild>
                      <NavLink to="/admin" className={mobileLinkClass}>
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4" />Admin
                        </span>
                      </NavLink>
                    </SheetClose>
                  )}
                </nav>
                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                  <Label htmlFor="show-hidden-mobile" className="text-sm cursor-pointer inline-flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    Show hidden{list.length > 0 ? ` (${list.length})` : ""}
                  </Label>
                  <Switch
                    id="show-hidden-mobile"
                    checked={showHidden}
                    onCheckedChange={setShowHidden}
                    aria-label="Show hidden videos"
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <Label htmlFor="hide-shorts-mobile" className="text-sm cursor-pointer inline-flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    Hide short videos
                  </Label>
                  <Switch
                    id="hide-shorts-mobile"
                    checked={hideShorts}
                    onCheckedChange={setHideShorts}
                    aria-label={`Hide videos ${shortsLimit} minutes or shorter`}
                  />
                </div>
                {hideShorts && (
                  <div className="mt-3 flex items-center gap-2 px-1">
                    <Label htmlFor="shorts-limit-mobile" className="text-sm text-muted-foreground">
                      Hide videos up to
                    </Label>
                    <Input
                      id="shorts-limit-mobile"
                      type="number"
                      min={1}
                      max={60}
                      value={shortsLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setShortsLimit(val);
                      }}
                      className="w-16 h-8 text-sm"
                      aria-label="Short video limit in minutes"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                )}
                {isSuperuser && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <Label htmlFor="show-saved-feed-mobile" className="text-sm cursor-pointer inline-flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                      Show saved in feed{savedList.length > 0 ? ` (${savedList.length})` : ""}
                    </Label>
                    <Switch
                      id="show-saved-feed-mobile"
                      checked={showSavedInFeed}
                      onCheckedChange={setShowSavedInFeed}
                      aria-label="Show saved videos in home feed"
                    />
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start mt-4 px-0"
                  onClick={closeAnd(handleSignOut)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/subscriptions" className={linkClass}>Channels</NavLink>
            <NavLink to="/saved" className={linkClass}>
              <span className="inline-flex items-center gap-1">
                <Bookmark className="h-3.5 w-3.5" />Saved
              </span>
            </NavLink>
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
            <div className="flex items-center gap-2" title={`Hide videos ${shortsLimit} minutes or shorter`}>
              <Timer className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="hide-shorts"
                checked={hideShorts}
                onCheckedChange={setHideShorts}
                aria-label={`Hide videos ${shortsLimit} minutes or shorter`}
              />
              <Label htmlFor="hide-shorts" className="text-xs text-muted-foreground cursor-pointer">
                Shorts
              </Label>
              {hideShorts && (
                <div className="flex items-center gap-1 ml-1">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={shortsLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setShortsLimit(val);
                    }}
                    className="w-12 h-6 px-1 text-xs text-center"
                    aria-label="Short video limit in minutes"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              )}
            </div>
            {isSuperuser && (
              <div className="flex items-center gap-2" title="Show saved videos in home feed">
                <Bookmark className="h-4 w-4 text-muted-foreground" />
                <Switch
                  id="show-saved-feed"
                  checked={showSavedInFeed}
                  onCheckedChange={setShowSavedInFeed}
                  aria-label="Show saved videos in home feed"
                />
                <Label htmlFor="show-saved-feed" className="text-xs text-muted-foreground cursor-pointer">
                  Saved{savedList.length > 0 ? ` (${savedList.length})` : ""}
                </Label>
              </div>
            )}
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
          </>
        )}
      </div>
    </header>
  );
}