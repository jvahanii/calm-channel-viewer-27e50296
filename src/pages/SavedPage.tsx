import { useEffect } from "react";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { useSavedVideos, savedToYTVideo } from "@/contexts/SavedVideos";

export default function SavedPage() {
  const { list, isLoading } = useSavedVideos();

  useEffect(() => {
    document.title = "Saved · Tuubmix";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <h1 className="font-display text-2xl font-semibold mb-6">Saved videos</h1>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground">
            No saved videos yet. Tap a video then use the bookmark button to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {list.map((s) => (
              <VideoCard key={s.id} video={savedToYTVideo(s)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}