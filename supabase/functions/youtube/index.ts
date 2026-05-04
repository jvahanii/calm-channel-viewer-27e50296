import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

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
]);

type YTVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
};

async function ytFetch(path: string, params: Record<string, string>, key: string) {
  const url = new URL(`${YT}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("YOUTUBE_API_KEY");
  if (!key) return json({ error: "YOUTUBE_API_KEY not configured" }, 500);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, 400);
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

    // channelLatest
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
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});