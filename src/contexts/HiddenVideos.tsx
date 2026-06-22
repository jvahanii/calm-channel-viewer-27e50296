import { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { YTVideo } from "@/lib/youtube";
import { toast } from "sonner";

export type HiddenVideo = {
  id: string;
  user_id: string;
  video_id: string;
  video_title: string;
  video_thumbnail: string | null;
  channel_id: string;
  channel_title: string;
  published_at: string | null;
  created_at: string;
};

type Ctx = {
  hiddenIds: Set<string>;
  list: HiddenVideo[];
  isHidden: (videoId: string) => boolean;
  hide: (v: { videoId: string; title: string; thumbnail?: string | null; channelId: string; channelTitle: string; publishedAt?: string | null }) => void;
  unhide: (videoId: string) => void;
  showHidden: boolean;
  setShowHidden: (v: boolean) => void;
  hideShorts: boolean;
  setHideShorts: (v: boolean) => void;
  shortsLimit: number;
  setShortsLimit: (v: number) => void;
};

const HiddenVideosContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "tuubmix:showHidden";
const SHORTS_KEY = "tuubmix:hideShorts";
const SHORTS_LIMIT_KEY = "tuubmix:shortsLimit";

export function HiddenVideosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showHidden, setShowHiddenState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? false : stored === "1";
  });

  const setShowHidden = (v: boolean) => {
    setShowHiddenState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {}
  };

  const [hideShorts, setHideShortsState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(SHORTS_KEY);
    return stored === "1";
  });

  const setHideShorts = (v: boolean) => {
    setHideShortsState(v);
    try {
      window.localStorage.setItem(SHORTS_KEY, v ? "1" : "0");
    } catch {}
  };

  const [shortsLimit, setShortsLimitState] = useState<number>(() => {
    if (typeof window === "undefined") return 5;
    const stored = window.localStorage.getItem(SHORTS_LIMIT_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 60 ? parsed : 5;
  });

  const setShortsLimit = (v: number) => {
    const clamped = Math.min(60, Math.max(1, v));
    setShortsLimitState(clamped);
    try {
      window.localStorage.setItem(SHORTS_LIMIT_KEY, String(clamped));
    } catch {}
  };

  const list = useQuery({
    queryKey: ["hidden_videos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<HiddenVideo[]> => {
      const { data, error } = await supabase
        .from("hidden_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HiddenVideo[];
    },
  });

  const hideMut = useMutation({
    mutationFn: async (input: {
      videoId: string;
      title: string;
      thumbnail?: string | null;
      channelId: string;
      channelTitle: string;
      publishedAt?: string | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("hidden_videos").insert({
        user_id: user.id,
        video_id: input.videoId,
        video_title: input.title,
        video_thumbnail: input.thumbnail ?? null,
        channel_id: input.channelId,
        channel_title: input.channelTitle,
        published_at: input.publishedAt ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hidden_videos", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const unhideMut = useMutation({
    mutationFn: async (videoId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("hidden_videos")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hidden_videos", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = list.data ?? [];
  const hiddenIds = new Set(items.map((h) => h.video_id));

  const value: Ctx = {
    hiddenIds,
    list: items,
    isHidden: (videoId) => hiddenIds.has(videoId),
    hide: (v) => hideMut.mutate(v),
    unhide: (videoId) => unhideMut.mutate(videoId),
    showHidden,
    setShowHidden,
    hideShorts,
    setHideShorts,
    shortsLimit,
    setShortsLimit,
  };

  return <HiddenVideosContext.Provider value={value}>{children}</HiddenVideosContext.Provider>;
}

export function useHiddenVideos() {
  const ctx = useContext(HiddenVideosContext);
  if (!ctx) throw new Error("useHiddenVideos must be used within HiddenVideosProvider");
  return ctx;
}

export function videoToHidePayload(v: YTVideo) {
  return {
    videoId: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail,
    channelId: v.channelId,
    channelTitle: v.channelTitle,
    publishedAt: v.publishedAt,
  };
}