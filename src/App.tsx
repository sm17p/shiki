import { CronTab } from "@/containers/CronTab";
import { Gallery } from "@/containers/Gallery";
import { DEFAULT_SCHEDULE, type ScheduleSettings } from "@/constants";
import { getStoreValue, setStoreValue } from "@/store";
import { isTauri } from "@tauri-apps/api/core";
import {
  checkPermissions,
  getMediaItems,
  type MediaItem,
  pickFolder,
  pickMedia,
} from "tauri-plugin-media-api";
import { onScreenUnlocked, setWallpaper } from "tauri-plugin-wallpaper-api";

import "./globals.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MINUTE_MS = 60_000;
const UNLOCK_DEBOUNCE_MS = 5_000;
type CycleSource = "manual" | "schedule" | "unlock";

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getCycleIntervalMs(schedule: ScheduleSettings) {
  const totalMinutes = schedule.hour * 60 + schedule.minute;
  return Math.max(totalMinutes, 1) * MINUTE_MS;
}

function isImageItem(item: MediaItem) {
  return item.mimeType ? item.mimeType.startsWith("image/") : true;
}

function App() {
  const [active, setActive] = useState("");
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastCycleAt, setLastCycleAt] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleSettings>(DEFAULT_SCHEDULE);
  const [status, setStatus] = useState("Ready");

  const busyRef = useRef(false);
  const cursorRef = useRef(cursor);
  const filesRef = useRef(files);
  const lastCycleAtRef = useRef(lastCycleAt);
  const scheduleRef = useRef(schedule);
  const unlockCycleAtRef = useRef(0);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    lastCycleAtRef.current = lastCycleAt;
  }, [lastCycleAt]);

  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [
        storedFiles,
        storedFolders,
        storedSchedule,
        storedActive,
        storedCursor,
        storedCycleAt,
      ] = await Promise.all([
        getStoreValue("files"),
        getStoreValue("folders"),
        getStoreValue("schedule"),
        getStoreValue("active"),
        getStoreValue("cursor"),
        getStoreValue("lastCycleAt"),
      ]);

      if (!mounted) {
        return;
      }

      setFiles(Array.isArray(storedFiles) ? storedFiles.filter(isImageItem) : []);
      setFolders(Array.isArray(storedFolders) ? storedFolders : []);
      setSchedule({ ...DEFAULT_SCHEDULE, ...storedSchedule });
      setActive(typeof storedActive === "string" ? storedActive : "");
      setCursor(typeof storedCursor === "number" ? storedCursor : 0);
      setLastCycleAt(typeof storedCycleAt === "number" ? storedCycleAt : 0);
      setHydrated(true);
    }

    void hydrate().catch((error: unknown) => {
      setStatus(`Store error: ${getErrorMessage(error)}`);
      setHydrated(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const activeItem = useMemo(() => files.find((item) => item.path === active), [active, files]);

  const persistSchedule = useCallback((next: ScheduleSettings) => {
    setSchedule(next);
    void setStoreValue("schedule", next);
  }, []);

  const updateSchedule = useCallback(
    (patch: Partial<ScheduleSettings>) => {
      persistSchedule({ ...schedule, ...patch });
    },
    [persistSchedule, schedule],
  );

  const toggleDay = useCallback(
    (dayId: number) => {
      const nextDays = schedule.days.includes(dayId)
        ? schedule.days.filter((id) => id !== dayId)
        : [...schedule.days, dayId].sort((a, b) => a - b);

      persistSchedule({ ...schedule, days: nextDays });
    },
    [persistSchedule, schedule],
  );

  const updateInterval = useCallback(
    (field: "hour" | "minute", value: number) => {
      const max = field === "hour" ? 23 : 59;
      persistSchedule({ ...schedule, [field]: clampNumber(value, 0, max) });
    },
    [persistSchedule, schedule],
  );

  const applyWallpaper = useCallback(async (item: MediaItem, source: CycleSource) => {
    if (busyRef.current) {
      return false;
    }

    busyRef.current = true;
    setBusy(true);
    setStatus(
      source === "schedule"
        ? "Cycling wallpaper"
        : source === "unlock"
          ? "Cycling after unlock"
          : "Setting wallpaper",
    );

    try {
      await setWallpaper({ path: item.path, mode: "fill", screen: "all" });

      const cycleAt = Date.now();
      setActive(item.path);
      setLastCycleAt(cycleAt);
      await Promise.all([
        setStoreValue("active", item.path),
        setStoreValue("lastCycleAt", cycleAt),
      ]);
      setStatus(`Active: ${item.displayName ?? "Untitled"}`);
      return true;
    } catch (error: unknown) {
      setStatus(`Wallpaper error: ${getErrorMessage(error)}`);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const applyNextWallpaper = useCallback(
    async (source: CycleSource = "manual") => {
      const list = filesRef.current;

      if (list.length === 0) {
        setStatus("No wallpapers loaded");
        return;
      }

      const currentIndex = ((cursorRef.current % list.length) + list.length) % list.length;
      const didApply = await applyWallpaper(list[currentIndex], source);

      if (didApply) {
        const nextCursor = (currentIndex + 1) % list.length;
        cursorRef.current = nextCursor;
        setCursor(nextCursor);
        await setStoreValue("cursor", nextCursor);
      }
    },
    [applyWallpaper],
  );

  const loadFolder = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setStatus("Opening folder picker");

    try {
      const permission = await checkPermissions().catch(() => ({ granted: true }));

      if (!permission.granted) {
        setStatus("Waiting for media access");
      }

      const folder = await pickFolder();
      const response = await getMediaItems(folder.uri);
      const imageItems = response.media.filter(isImageItem);
      const nextFolders = [folder.uri];
      const nextActive = imageItems.some((item) => item.path === active) ? active : "";

      setFolders(nextFolders);
      setFiles(imageItems);
      setActive(nextActive);
      setCursor(0);

      await Promise.all([
        setStoreValue("folders", nextFolders),
        setStoreValue("files", imageItems),
        setStoreValue("active", nextActive),
        setStoreValue("cursor", 0),
      ]);

      setStatus(`Loaded ${imageItems.length} wallpaper${imageItems.length === 1 ? "" : "s"}`);
    } catch (error: unknown) {
      setStatus(`Media error: ${getErrorMessage(error)}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [active]);

  const addWallpaper = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setStatus("Opening wallpaper picker");

    try {
      const item = await pickMedia();

      if (!isImageItem(item)) {
        setStatus("Selected file is not a wallpaper image");
        return;
      }

      const currentFiles = filesRef.current;
      const exists = currentFiles.some((file) => file.path === item.path);
      const nextFiles = exists
        ? currentFiles.map((file) => (file.path === item.path ? item : file))
        : [...currentFiles, item];

      setFiles(nextFiles);
      await setStoreValue("files", nextFiles);
      setStatus(
        exists ? "Wallpaper already in gallery" : `Added ${item.displayName ?? "wallpaper"}`,
      );
    } catch (error: unknown) {
      setStatus(`Media error: ${getErrorMessage(error)}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !schedule.enabled || files.length === 0) {
      return undefined;
    }

    const tick = () => {
      const today = new Date().getDay();

      if (!schedule.days.includes(today) || busyRef.current) {
        return;
      }

      const elapsedMs = Date.now() - lastCycleAtRef.current;

      if (elapsedMs >= getCycleIntervalMs(schedule)) {
        void applyNextWallpaper("schedule");
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 15_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [applyNextWallpaper, files.length, hydrated, schedule]);

  useEffect(() => {
    if (!hydrated || !isTauri()) {
      return undefined;
    }

    let disposed = false;
    let unregister: (() => Promise<void>) | undefined;

    void onScreenUnlocked(() => {
      const currentSchedule = scheduleRef.current;
      const today = new Date().getDay();
      const now = Date.now();

      if (
        !currentSchedule.unlock ||
        !currentSchedule.days.includes(today) ||
        filesRef.current.length === 0 ||
        busyRef.current ||
        now - unlockCycleAtRef.current < UNLOCK_DEBOUNCE_MS
      ) {
        return;
      }

      unlockCycleAtRef.current = now;
      void applyNextWallpaper("unlock");
    })
      .then((listener) => {
        if (disposed) {
          void listener.unregister();
          return;
        }

        unregister = () => listener.unregister();
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setStatus(`Unlock listener error: ${getErrorMessage(error)}`);
        }
      });

    return () => {
      disposed = true;
      void unregister?.();
    };
  }, [applyNextWallpaper, hydrated]);

  return (
    <main className="min-h-screen w-screen flex flex-col bg-background text-foreground">
      <CronTab
        activeItem={activeItem}
        busy={busy}
        fileCount={files.length}
        folders={folders}
        onAddWallpaper={addWallpaper}
        onLoadFolder={loadFolder}
        onNextWallpaper={() => void applyNextWallpaper("manual")}
        onToggleDay={toggleDay}
        onToggleEnabled={() => updateSchedule({ enabled: !schedule.enabled })}
        onToggleUnlock={() => updateSchedule({ unlock: !schedule.unlock })}
        onUpdateInterval={updateInterval}
        schedule={schedule}
        status={status}
      />
      <Gallery
        activePath={active}
        busy={busy}
        files={files}
        onAddWallpaper={addWallpaper}
        onLoadFolder={loadFolder}
        onNextWallpaper={() => void applyNextWallpaper("manual")}
        onSetWallpaper={(item) => void applyWallpaper(item, "manual")}
      />
    </main>
  );
}

export default App;
