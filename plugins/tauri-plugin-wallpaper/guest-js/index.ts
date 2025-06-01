// plugins/tauri-plugin-wallpaper/guest-js/index.ts
import { invoke } from '@tauri-apps/api/core';

export interface WallpaperOptions {
  /**
   * The path to the image file.
   * On Android, this should be a content URI (e.g., "content://media/external/images/media/123").
   * On desktop, a file path (e.g., "/path/to/image.jpg" or "C:\\path\\to\\image.jpg").
   */
  path: string;
  /**
   * Optional: Specifies which screen to set the wallpaper on.
   * - "all" (default for macOS/Windows, Linux depends on DE)
   * - "main" (macOS/Windows primary screen)
   * - Specific screen identifier (platform-dependent)
   * @defaultValue "all"
   */
  screen?: string;
  /**
   * Optional: How the image should be displayed.
   * - "fill": Fills the screen, potentially cropping.
   * - "fit": Fits the image, potentially adding black bars.
   * - "stretch": Stretches to fill the screen, may distort.
   * - "center": Centers the image without scaling.
   * - "tile": Tiles the image.
   * @defaultValue "stretch" (or platform default)
   */
  mode?: 'fill' | 'fit' | 'stretch' | 'center' | 'tile';
   [key: string]: unknown; // Allows for arbitrary additional properties, mak
}

export interface WallpaperInfo {
  path?: string;
  screen?: string;
  // Add more properties if you implement retrieval for them
}

/**
 * Sets the wallpaper to the specified image.
 * @param options - The wallpaper options.
 */
export async function setWallpaper(options: WallpaperOptions): Promise<void> {
  await invoke('plugin:wallpaper|set_wallpaper', options);
}

/**
 * Gets information about the current wallpaper.
 * Note: Retrieval might be limited or not supported on all platforms.
 * @param screen - Optional: Which screen's wallpaper to get info for.
 */
export async function getWallpaperInfo(screen?: string): Promise<WallpaperInfo> {
  return await invoke('plugin:wallpaper|get_wallpaper_info', { screen });
}