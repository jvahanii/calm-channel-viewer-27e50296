import { motion } from "framer-motion";
import { Play, EyeOff, Eye } from "lucide-react";
import { useState } from "react";
import { timeAgo, type YTVideo } from "@/lib/youtube";
import { useHiddenVideos, videoToHidePayload } from "@/contexts/HiddenVideos";
type Props = {
  video: YTVideo;
  onPlay?: (v: YTVideo) => void;
};

export function VideoCard({ video }: Props) {
  const { isHidden, hide, unhide } = useHiddenVideos();
  const hidden = isHidden(video.videoId);
  const [revealed, setRevealed] = useState(false);

  const openOnYouTube = () => {
    window.open(
      `https://www.youtube.com/watch?v=${video.videoId}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleClick = () => {
    setRevealed((r) => !r);
  };

  const controlsVisible = revealed;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group text-left flex flex-col gap-3 rounded-xl relative cursor-pointer select-none"
      style={{ WebkitTouchCallout: "none" }}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-card">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        {video.duration && (
          <span className="absolute bottom-2 right-2 inline-flex items-center rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-medium text-foreground shadow-soft">
            {video.duration}
          </span>
        )}
        <div
          className={`absolute inset-0 transition-colors flex items-center justify-center ${
            controlsVisible ? "bg-foreground/20" : "bg-foreground/0 group-hover:bg-foreground/20"
          }`}
        >
          <button
            type="button"
            aria-label="Open on YouTube"
            onClick={(e) => {
              e.stopPropagation();
              openOnYouTube();
            }}
            className={`transition-opacity rounded-full bg-background/95 p-4 sm:p-3 shadow-soft hover:bg-background ${
              controlsVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Play className="h-6 w-6 sm:h-5 sm:w-5 text-primary fill-primary" />
          </button>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (hidden) unhide(video.videoId);
            else hide(videoToHidePayload(video));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              if (hidden) unhide(video.videoId);
              else hide(videoToHidePayload(video));
            }
          }}
          aria-label={hidden ? "Unhide video" : "Hide video"}
          title={hidden ? "Unhide video" : "Hide video"}
          className={`absolute top-2 right-2 inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft transition-opacity hover:bg-background cursor-pointer ${
            controlsVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {hidden ? <Eye className="h-5 w-5 sm:h-4 sm:w-4" /> : <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" />}
        </span>
      </div>
      <div className="px-1">
        <h3 className="font-display text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {video.channelTitle} · {timeAgo(video.publishedAt)}
        </p>
      </div>
    </motion.div>
  );
}