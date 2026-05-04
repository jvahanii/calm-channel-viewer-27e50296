import { supabase } from "@/integrations/supabase/client";

export type YTVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
};

export type YTSearchItem = {
  id: { kind: string; videoId?: string; channelId?: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
};

export type YTChannelInfo = {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { default?: { url: string }; medium?: { url: string }; high?: { url: string } };
  };
  statistics: { subscriberCount?: string; videoCount?: string; viewCount?: string };
};

async function call<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("youtube", { body: payload });
  if (error) throw error;
  if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "YouTube error");
  return data as T;
}

export const youtube = {
  search: (q: string) => call<{ items: YTSearchItem[] }>({ action: "search", q }),
  channelLatest: (channelIds: string[], perChannel = 5) =>
    call<{ items: YTVideo[] }>({ action: "channelLatest", channelIds, perChannel }),
  channelInfo: (channelId: string) =>
    call<{ items: YTChannelInfo[] }>({ action: "channelInfo", channelId }),
};

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(d / 365);
  return `${y}y ago`;
}