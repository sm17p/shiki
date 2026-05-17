import { FolderOpen, ImagePlus, Wallpaper } from "lucide-react";
import { lazy, Suspense } from "react";
import type { MediaItem } from "tauri-plugin-media-api";
import { Button } from "@/components/ui/button";

const HoneycombGallery = lazy(() => import("@/components/HoneycombGallery"));

type GalleryProps = {
  activePath: string;
  busy: boolean;
  files: MediaItem[];
  onAddWallpaper: () => void;
  onLoadFolder: () => void;
  onNextWallpaper: () => void;
  onSetWallpaper: (item: MediaItem) => void;
};

export function Gallery({
  activePath,
  busy,
  files,
  onAddWallpaper,
  onLoadFolder,
  onNextWallpaper,
  onSetWallpaper,
}: GalleryProps) {
  if (files.length === 0) {
    return (
      <section className="px-4 py-8 flex-1 bg-white">
        <div className="mx-auto grid max-w-sm gap-4 text-center">
          <div className="text-lg font-heading">No wallpapers loaded</div>
          <div className="grid grid-cols-2 gap-3">
            <Button disabled={busy} onClick={onAddWallpaper} type="button" variant="neutral">
              <ImagePlus />
              Add
            </Button>
            <Button disabled={busy} onClick={onLoadFolder} type="button" variant="neutral">
              <FolderOpen />
              Folder
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <h2 className="m-0 text-2xl">Gallery</h2>
        <div className="flex gap-2">
          <Button
            aria-label="Add wallpaper"
            disabled={busy}
            onClick={onAddWallpaper}
            size="icon"
            title="Add wallpaper"
            type="button"
            variant="neutral"
          >
            <ImagePlus />
          </Button>
          <Button
            aria-label="Cycle now"
            disabled={busy}
            onClick={onNextWallpaper}
            size="icon"
            title="Cycle now"
            type="button"
            variant="neutral"
          >
            <Wallpaper />
          </Button>
        </div>
      </div>
      <Suspense fallback={<div className="h-[58vh] min-h-[420px] bg-white" />}>
        <HoneycombGallery activePath={activePath} items={files} onSelect={onSetWallpaper} />
      </Suspense>
    </section>
  );
}
