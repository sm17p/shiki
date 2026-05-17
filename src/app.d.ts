import type { DayOfWeek, ScheduleSettings } from "@/constants";
import type { MediaItem } from "tauri-plugin-media-api";

declare global {
  interface AppStore {
    days: DayOfWeek[];
    schedule: ScheduleSettings;
    folders: string[];
    files: MediaItem[];
    active: string;
    cursor: number;
    lastCycleAt: number;
  }
}

export {};
