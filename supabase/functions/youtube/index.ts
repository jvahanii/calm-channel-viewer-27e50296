import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const YT = "https://www.googleapis.com/youtube/v3";

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), q: z.string().min(1).max(200) }),
  z.object({
    action: z.literal("channelLatest"),
    channelIds: z.array(z.string().min(1)).min(1).max(50),
    perChannel: z.number().int().min(1).max(15).optional(),
  }),
  z.object({ action: z.literal("channelInfo"), channelId: z.string().min(1) }),
  z.object({
    action: z.literal("channelVideos"),
    channelId: z.string().min(1),
    pageToken: z.string().optional(),
    pageSize: z.number().int().min(1).max(50).optional(),
  }),
]);

type YTVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
};

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const s = parseInt(match[3] ?? "0", 10);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function fetchDurations(videoIds: string[], key: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (videoIds.length === 0) return map;
  const BATCH = 50;
  for (let i = 0; i < videoIds.length; i += BATCH) {
    const batch = videoIds.slice(i, i + BATCH);
    const res = await ytFetch(
      "videos",
      { part: "contentDetails", id: batch.join(",") },
      key,
    );
    for (const it of res.items ?? []) {
      const dur = it.contentDetails?.duration;
      if (dur) map.set(it.id, parseDuration(dur));
    }
  }
  return map;
}

async function ytFetch(path: string, params: Record<string, string>, key: string) {
  const url = new URL(`${YT}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    console.error("YouTube API error", path, res.status, text);
    throw new Error("YouTube API request failed");
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authenticated caller to prevent quota abuse
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const key = Deno.env.get("YOUTUBE_API_KEY");
  if (!key) {
    console.error("YOUTUBE_API_KEY not configured");
    return json({ error: "Service unavailable" }, 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid request" }, 400);
  }

  try {
    const data = parsed.data;

    if (data.action === "search") {
      const res = await ytFetch(
        "search",
        { part: "snippet", q: data.q, type: "video,channel", maxResults: "25" },
        key,
      );
      return json(res);
    }

    if (data.action === "channelInfo") {
      const res = await ytFetch(
        "channels",
        { part: "snippet,statistics", id: data.channelId },
        key,
      );
      return json(res);
    }

    if (data.action === "channelVideos") {
      const chRes = await ytFetch(
        "channels",
        { part: "contentDetails,snippet", id: data.channelId },
        key,
      );
      const ch = chRes.items?.[0];
      if (!ch) return json({ items: [], nextPageToken: null });
      const uploads = ch.contentDetails.relatedPlaylists.uploads;
      const pageSize = data.pageSize ?? 24;
      const params: Record<string, string> = {
        part: "snippet,contentDetails",
        playlistId: uploads,
        maxResults: String(pageSize),
      };
      if (data.pageToken) params.pageToken = data.pageToken;
      const res = await ytFetch("playlistItems", params, key);
      const items: YTVideo[] = (res.items ?? []).map((it: any) => {
        const sn = it.snippet;
        const thumbs = sn.thumbnails ?? {};
        return {
          videoId: it.contentDetails?.videoId ?? sn.resourceId?.videoId,
          title: sn.title,
          channelId: ch.id,
          channelTitle: ch.snippet.title,
          thumbnail: thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? "",
          publishedAt: it.contentDetails?.videoPublishedAt ?? sn.publishedAt,
        };
      });
      const durations = await fetchDurations(
        items.map((v) => v.videoId).filter(Boolean),
        key,
      );
      for (const v of items) {
        v.duration = durations.get(v.videoId);
      }
      return json({ items, nextPageToken: res.nextPageToken ?? null });
    }

    const perChannel = data.perChannel ?? 5;
    const channelsRes = await ytFetch(
      "channels",
      { part: "contentDetails,snippet", id: data.channelIds.join(",") },
      key,
    );
    const channels: Array<{
      id: string;
      snippet: { title: string; thumbnails: { default?: { url: string }; medium?: { url: string } } };
      contentDetails: { relatedPlaylists: { uploads: string } };
    }> = channelsRes.items ?? [];

    const playlistResults = await Promise.all(
      channels.map((ch) =>
        ytFetch(
          "playlistItems",
          {
            part: "snippet,contentDetails",
            playlistId: ch.contentDetails.relatedPlaylists.uploads,
            maxResults: String(perChannel),
          },
          key,
        ).catch(() => ({ items: [] })),
      ),
    );

    const items: YTVideo[] = [];
    playlistResults.forEach((res, idx) => {
      const ch = channels[idx];
      for (const it of res.items ?? []) {
        const sn = it.snippet;
        const thumbs = sn.thumbnails ?? {};
        const thumb =
          thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? "";
        items.push({
          videoId: it.contentDetails?.videoId ?? sn.resourceId?.videoId,
          title: sn.title,
          channelId: ch.id,
          channelTitle: ch.snippet.title,
          thumbnail: thumb,
          publishedAt: it.contentDetails?.videoPublishedAt ?? sn.publishedAt,
        });
      }
    });

    items.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    return json({ items });
  } catch (err) {
    console.error("youtube fn error", err);
    return json({ error: "Request failed" }, 500);
  }
});
