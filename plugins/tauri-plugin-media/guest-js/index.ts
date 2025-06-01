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

export interface PermissionResult {
  granted: boolean;
}

export interface FolderPath {
  uri: string;
}

export interface MediaResponse {
  media: MediaItem[]
}

export async function getMediaItems(uri: string): Promise<MediaResponse> {
  return await invoke('plugin:media|get_media_items', {
      uri,
  });
}

export async function requestPermissions(): Promise<PermissionResult> {
  return await invoke('plugin:media|request_media_permissions');
}

export async function checkPermissions(): Promise<PermissionResult> {
  return await invoke('plugin:media|check_media_permissions');
}

export async function pickFolder(): Promise<FolderPath> {
  return await invoke('plugin:media|pick_folder');
}