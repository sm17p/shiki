use tauri::{AppHandle, Runtime};

use crate::models::*;
use crate::{Result, WallpaperExt};

#[tauri::command]
pub(crate) async fn set_wallpaper<R: Runtime>(
    app: AppHandle<R>,
    path: String,
    screen: Option<String>,
    mode: Option<String>,
) -> Result<()> {
    app.wallpaper()
        .set_wallpaper(WallpaperOptions { path, screen, mode })
}

#[tauri::command]
pub(crate) async fn get_wallpaper_info<R: Runtime>(
    app: AppHandle<R>,
    screen: Option<String>,
) -> Result<WallpaperInfo> {
    app.wallpaper().get_wallpaper_info(screen)
}

#[tauri::command]
pub(crate) async fn check_permissions<R: Runtime>(app: AppHandle<R>) -> Result<PermissionResult> {
    app.wallpaper().check_permissions()
}
