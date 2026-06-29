import { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { YTVideo } from "@/lib/youtube";
import { toast } from "sonner";

export type SavedVideo = {
  id: string;
  user_id: string;
  video_id: string;
  video_title: string;
  video_thumbnail: string | null;
  video_duration: string | null;
  channel_id: string;
  channel_title: string;
  published_at: string | null;
  created_at: string;
};

type SavePayload = {
  videoId: string;
  title: string;
  thumbnail?: string | null;
  duration?: string | null;
  channelId: string;
  channelTitle: string;
  publishedAt?: string | null;
};

type Ctx = {
  savedIds: Set<string>;
  list: SavedVideo[];
  isLoading: boolean;
  isSaved: (videoId: string) => boolean;
  save: (v: SavePayload) => void;
  unsave: (videoId: string) => void;
  showSavedInFeed: boolean;
  setShowSavedInFeed: (v: boolean) => void;
};

const SavedVideosContext = createContext<Ctx | null>(null);

export function SavedVideosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [showSavedInFeed, setShowSavedInFeedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("tuubmix.showSavedInFeed") === "true";
  });
  const setShowSavedInFeed = (v: boolean) => {
    setShowSavedInFeedState(v);
    try {
      window.localStorage.setItem("tuubmix.showSavedInFeed", String(v));
    } catch {}
  };

  const list = useQuery({
    queryKey: ["saved_videos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavedVideo[]> => {
      const { data, error } = await supabase
        .from("saved_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedVideo[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (input: SavePayload) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("saved_videos").insert({
        user_id: user.id,
        video_id: input.videoId,
        video_title: input.title,
        video_thumbnail: input.thumbnail ?? null,
        video_duration: input.duration ?? null,
        channel_id: input.channelId,
        channel_title: input.channelTitle,
        published_at: input.publishedAt ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved_videos", user?.id] });
      toast.success("Saved to your list");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unsaveMut = useMutation({
    mutationFn: async (videoId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("saved_videos")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_videos", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = list.data ?? [];
  const savedIds = new Set(items.map((s) => s.video_id));

  const value: Ctx = {
    savedIds,
    list: items,
    isLoading: list.isLoading,
    isSaved: (videoId) => savedIds.has(videoId),
    save: (v) => saveMut.mutate(v),
    unsave: (videoId) => unsaveMut.mutate(videoId),
    showSavedInFeed,
    setShowSavedInFeed,
  };

  return <SavedVideosContext.Provider value={value}>{children}</SavedVideosContext.Provider>;
}

export function useSavedVideos() {
  const ctx = useContext(SavedVideosContext);
  if (!ctx) throw new Error("useSavedVideos must be used within SavedVideosProvider");
  return ctx;
}

export function videoToSavePayload(v: YTVideo): SavePayload {
  return {
    videoId: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail,
    duration: v.duration ?? null,
    channelId: v.channelId,
    channelTitle: v.channelTitle,
    publishedAt: v.publishedAt,
  };
}

export function savedToYTVideo(s: SavedVideo): YTVideo {
  return {
    videoId: s.video_id,
    title: s.video_title,
    channelId: s.channel_id,
    channelTitle: s.channel_title,
    thumbnail: s.video_thumbnail ?? "",
    publishedAt: s.published_at ?? "",
    duration: s.video_duration ?? undefined,
  };
}