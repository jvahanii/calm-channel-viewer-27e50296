import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { timeAgo, type YTVideo } from "@/lib/youtube";

type Props = {
  video: YTVideo;
  onPlay: (v: YTVideo) => void;
};

export function VideoCard({ video, onPlay }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onPlay(video)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group text-left flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
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
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/95 p-3 shadow-soft">
            <Play className="h-5 w-5 text-primary fill-primary" />
          </div>
        </div>
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