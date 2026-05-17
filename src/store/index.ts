import { LazyStore } from "@tauri-apps/plugin-store";
import { DAYS_OF_WEEK, DEFAULT_SCHEDULE, type DayOfWeek, type ScheduleSettings } from "@/constants";
import type { MediaItem } from "tauri-plugin-media-api";

export type AppStore = {
  days: DayOfWeek[];
  schedule: ScheduleSettings;
  folders: string[];
  files: MediaItem[];
  active: string;
  cursor: number;
  lastCycleAt: number;
};

export const STORE_DEFAULTS: AppStore = {
  days: DAYS_OF_WEEK,
  schedule: DEFAULT_SCHEDULE,
  folders: [],
  files: [],
  active: "",
  cursor: 0,
  lastCycleAt: 0,
};

export const store = new LazyStore("store.json", {
  autoSave: true,
  defaults: STORE_DEFAULTS,
});

export async function getStoreValue<K extends keyof AppStore & string>(
  key: K,
): Promise<AppStore[K]> {
  const value = await store.get<AppStore[K]>(key);
  return value ?? STORE_DEFAULTS[key];
}

export async function setStoreValue<K extends keyof AppStore & string>(
  key: K,
  value: AppStore[K],
): Promise<void> {
  await store.set(key, value);
}
