/// <reference types="tauri-media-plugin-api" />

interface DaysOfWeek {
    id: number;
    code: string;
    longName: string;
    shortName: string;
    active: boolean;
}

interface AppStore {
    days: DaysOfWeek[];
    min: number;
    hour: number;
    schedule: string[];
    folders: string[];
    files: MediaItem[];
    active: string;
}