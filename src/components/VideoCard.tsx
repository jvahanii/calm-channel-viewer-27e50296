import { motion } from "framer-motion";
import { Play, EyeOff, Eye } from "lucide-react";
import { timeAgo, type YTVideo } from "@/lib/youtube";
import { useHiddenVideos, videoToHidePayload } from "@/contexts/HiddenVideos";

type Props = {
  video: YTVideo;
  onPlay: (v: YTVideo) => void;
};

export function VideoCard({ video, onPlay }: Props) {
  const { isHidden, hide, unhide } = useHiddenVideos();
  const hidden = isHidden(video.videoId);
  return (
    <motion.button
      type="button"
      onClick={() => onPlay(video)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group text-left flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl relative"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-card">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${hidden ? "opacity-50" : ""}`}
          />
        ) : null}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/95 p-3 shadow-soft">
            <Play className="h-5 w-5 text-primary fill-primary" />
          </div>
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
          className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background cursor-pointer"
        >
          {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
    </motion.button>
  );
}