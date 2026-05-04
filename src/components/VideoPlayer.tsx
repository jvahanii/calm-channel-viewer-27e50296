import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  videoId: string | null;
  title?: string;
  onClose: () => void;
};

export function VideoPlayer({ videoId, title, onClose }: Props) {
  return (
    <Dialog open={!!videoId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-border bg-card">
        <DialogTitle className="sr-only">{title ?? "Video player"}</DialogTitle>
        {videoId && (
          <div className="aspect-video w-full bg-black">
            <iframe
              key={videoId}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={title ?? "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}
        {title && (
          <div className="p-5">
            <h2 className="font-display text-lg leading-snug">{title}</h2>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}