use serde::de::DeserializeOwned;
use tauri::{AppHandle, Runtime, plugin::PluginApi};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<Wallpaper<R>> {
    Ok(Wallpaper(app.clone()))
}

/// Access to the wallpaper APIs.
pub struct Wallpaper<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Wallpaper<R> {
    pub fn set_wallpaper(&self, _options: WallpaperOptions) -> crate::Result<()> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn get_wallpaper_info(&self, screen: Option<String>) -> crate::Result<WallpaperInfo> {
        Ok(WallpaperInfo { path: None, screen })
    }

    pub fn check_permissions(&self) -> crate::Result<PermissionResult> {
        Ok(PermissionResult { granted: false })
    }
}
