// tauri-plugin-media/guest-js/index.ts
import { invoke } from "@tauri-apps/api/core";

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
  media: MediaItem[];
}

export class ShikiImageLoader {
  private static instance: ShikiImageLoader;

  static getInstance(): ShikiImageLoader {
    if (!ShikiImageLoader.instance) {
      ShikiImageLoader.instance = new ShikiImageLoader();
    }
    return ShikiImageLoader.instance;
  }

  getThumbnailUrl(contentUri: string): string {
    if (this.canLoadDirectly(contentUri)) {
      return contentUri;
    }

    return `shiki://localhost/image/${encodeURIComponent(contentUri)}?thumbnail=true`;
  }

  getFullImageUrl(contentUri: string): string {
    if (this.canLoadDirectly(contentUri)) {
      return contentUri;
    }

    return `shiki://localhost/image/${encodeURIComponent(contentUri)}`;
  }

  private canLoadDirectly(uri: string): boolean {
    return uri.startsWith("data:") || uri.startsWith("blob:") || uri.startsWith("http");
  }

  async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}

export const ImageLoader = ShikiImageLoader.getInstance();

export async function getMediaItems(uri: string): Promise<MediaResponse> {
  return await invoke("plugin:media|get_media_items", {
    uri,
  });
}

export async function requestPermissions(): Promise<PermissionResult> {
  return await invoke("plugin:media|request_media_permissions");
}

export async function checkPermissions(): Promise<PermissionResult> {
  return await invoke("plugin:media|check_media_permissions");
}

export async function pickFolder(): Promise<FolderPath> {
  return await invoke("plugin:media|pick_folder");
}

export async function pickMedia(): Promise<MediaItem> {
  return await invoke("plugin:media|pick_media");
}
