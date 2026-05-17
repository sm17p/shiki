import { FolderOpen, ImagePlus, LockOpen, Pause, Play, RotateCw } from "lucide-react";
import type { MediaItem } from "tauri-plugin-media-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAYS_OF_WEEK, type ScheduleSettings } from "@/constants";

const HEADER_TEXTS = ["四季", "Shiki", "ऋतुएँ", "Rituye"];

type CronTabProps = {
  activeItem?: MediaItem;
  busy: boolean;
  fileCount: number;
  folders: string[];
  onAddWallpaper: () => void;
  onLoadFolder: () => void;
  onNextWallpaper: () => void;
  onToggleDay: (dayId: number) => void;
  onToggleEnabled: () => void;
  onToggleUnlock: () => void;
  onUpdateInterval: (field: "hour" | "minute", value: number) => void;
  schedule: ScheduleSettings;
  status: string;
};

function formatFolderName(folders: string[]) {
  const folder = folders[0];

  if (!folder) {
    return "No folder";
  }

  const segments = folder.split("/").filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1] ?? folder);
}

export function CronTab({
  activeItem,
  busy,
  fileCount,
  folders,
  onAddWallpaper,
  onLoadFolder,
  onNextWallpaper,
  onToggleDay,
  onToggleEnabled,
  onToggleUnlock,
  onUpdateInterval,
  schedule,
  status,
}: CronTabProps) {
  const totalMinutes = schedule.hour * 60 + schedule.minute;

  return (
    <section className="px-4 py-5 cron-tab grid grid-cols-1 gap-5 border-b-5">
      <div className="flex items-start gap-3 justify-between">
        <h1 className="mt-0 mb-0 text-5xl leading-none">{HEADER_TEXTS[0].toString()}</h1>
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
            aria-label="Pick wallpaper folder"
            disabled={busy}
            onClick={onLoadFolder}
            size="icon"
            title="Pick wallpaper folder"
            type="button"
            variant="neutral"
          >
            <FolderOpen />
          </Button>
          <Button
            aria-label="Cycle now"
            disabled={busy || fileCount === 0}
            onClick={onNextWallpaper}
            size="icon"
            title="Cycle now"
            type="button"
            variant="neutral"
          >
            <RotateCw />
          </Button>
          <Button
            aria-label={schedule.enabled ? "Pause schedule" : "Start schedule"}
            disabled={busy || fileCount === 0}
            onClick={onToggleEnabled}
            pressed={schedule.enabled}
            size="icon"
            title={schedule.enabled ? "Pause schedule" : "Start schedule"}
            type="button"
            variant="neutral"
          >
            {schedule.enabled ? <Pause /> : <Play />}
          </Button>
          <Button
            aria-label={schedule.unlock ? "Disable unlock cycling" : "Enable unlock cycling"}
            disabled={busy}
            onClick={onToggleUnlock}
            pressed={schedule.unlock}
            size="icon"
            title={schedule.unlock ? "Disable unlock cycling" : "Enable unlock cycling"}
            type="button"
            variant="neutral"
          >
            <LockOpen />
          </Button>
        </div>
      </div>

      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle className="font-light text-neutral-500">Cycle</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-neutral-500">Folder</div>
              <div className="truncate font-heading">{formatFolderName(folders)}</div>
            </div>
            <div>
              <div className="text-neutral-500">Wallpapers</div>
              <div className="font-heading">{fileCount}</div>
            </div>
            <div>
              <div className="text-neutral-500">Active</div>
              <div className="truncate font-heading">{activeItem?.displayName ?? "None"}</div>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <Button
                aria-label={day.longName}
                key={day.id}
                className="min-w-10 rounded-full px-0"
                onClick={() => onToggleDay(day.id)}
                pressed={schedule.days.includes(day.id)}
                size="icon"
                title={day.longName}
                type="button"
                variant="neutral"
              >
                {day.code}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-4">
            <div className="grid items-center gap-1.5">
              <Label className="text-center text-neutral-500" htmlFor="hour">
                Hour
              </Label>
              <Input
                className="text-center text-neutral-500"
                id="hour"
                max={23}
                min={0}
                onChange={(event) => onUpdateInterval("hour", event.currentTarget.valueAsNumber)}
                type="number"
                value={schedule.hour}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <Label className="text-center text-neutral-500" htmlFor="minute">
                Min
              </Label>
              <Input
                className="text-center text-neutral-500"
                id="minute"
                max={59}
                min={0}
                onChange={(event) => onUpdateInterval("minute", event.currentTarget.valueAsNumber)}
                type="number"
                value={schedule.minute}
              />
            </div>
            <div className="pb-2 text-sm text-neutral-500">{Math.max(totalMinutes, 1)}m</div>
          </div>

          <div className="min-h-6 truncate text-sm text-neutral-500">{status}</div>
        </CardContent>
      </Card>
    </section>
  );
}
