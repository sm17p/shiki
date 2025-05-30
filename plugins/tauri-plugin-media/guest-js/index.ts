// tauri-plugin-media/guest-js/index.ts
import { invoke } from '@tauri-apps/api/core';

export interface MediaItem {
  id: string;
  displayName: string | null;
  path: string; // Content URI on Android, file:// URL on iOS
  mimeType: string | null;
  dateAdded: number; // Unix timestamp
  width: number;
  height: number;
  duration?: number; // In milliseconds, for videos
}

export async function getMediaItems(): Promise<MediaItem[]> {
  return await invoke('plugin:media|get_media_items');
}

export async function requestPermissions(): Promise<boolean> {
  return await invoke('plugin:media|request_permissions');
}

export async function checkPermissions(): Promise<boolean> {
  return await invoke('plugin:media|check_permissions');
}