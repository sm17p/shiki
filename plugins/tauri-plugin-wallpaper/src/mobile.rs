use serde::de::DeserializeOwned;
use std::marker::PhantomData;
#[cfg(target_os = "android")]
use tauri::plugin::PluginHandle;
use tauri::{AppHandle, Runtime, plugin::PluginApi};

use crate::models::*;

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<Wallpaper<R>> {
    #[cfg(target_os = "android")]
    {
        let handle = api.register_android_plugin("me.sm17p.shiki.wallpaper", "WallpaperPlugin")?;
        return Ok(Wallpaper {
            handle,
            _runtime: PhantomData,
        });
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = api;
        Ok(Wallpaper {
            _runtime: PhantomData,
        })
    }
}

/// Access to the wallpaper APIs.
pub struct Wallpaper<R: Runtime> {
    #[cfg(target_os = "android")]
    handle: PluginHandle<R>,
    _runtime: PhantomData<fn() -> R>,
}

impl<R: Runtime> Wallpaper<R> {
    pub fn set_wallpaper(&self, options: WallpaperOptions) -> crate::Result<()> {
        #[cfg(target_os = "android")]
        {
            return self
                .handle
                .run_mobile_plugin("setWallpaper", options)
                .map_err(Into::into);
        }

        #[cfg(not(target_os = "android"))]
        {
            let _ = options;
            Err(crate::Error::UnsupportedPlatform)
        }
    }

    pub fn get_wallpaper_info(&self, screen: Option<String>) -> crate::Result<WallpaperInfo> {
        #[cfg(target_os = "android")]
        {
            return self
                .handle
                .run_mobile_plugin("getWallpaperInfo", WallpaperInfo { path: None, screen })
                .map_err(Into::into);
        }

        #[cfg(not(target_os = "android"))]
        {
            Ok(WallpaperInfo { path: None, screen })
        }
    }

    pub fn check_permissions(&self) -> crate::Result<PermissionResult> {
        #[cfg(target_os = "android")]
        {
            return self
                .handle
                .run_mobile_plugin("checkPermissions", ())
                .map_err(Into::into);
        }

        #[cfg(not(target_os = "android"))]
        {
            Ok(PermissionResult { granted: false })
        }
    }
}
