import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
        <div className="absolute top-3 left-3 z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-background/80 backdrop-blur-md hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
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