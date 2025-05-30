use serde::de::DeserializeOwned;
use tauri::{AppHandle, Runtime, plugin::{PluginApi, PluginHandle}};

use crate::models::{MediaExt as ModelsMediaExt, MediaItem};

// use crate::android;
// use crate::ios;
use crate::error::{Error, Result};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "me.sm17p.shiki.media";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_media);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> Result<Media<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "MediaPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_media)?;
    Ok(Media(handle))
}

#[cfg(mobile)]
pub struct Media<R: Runtime>(PluginHandle<R>);

#[cfg(mobile)]
impl<R: Runtime> ModelsMediaExt<R> for Media<R> {
    fn get_media_items(&self) -> Result<Vec<MediaItem>> {
        #[cfg(not(any(target_os = "android", target_os = "ios")))]
        return Err(Error::UnsupportedPlatform);

        self.0
            .run_mobile_plugin("getMediaItems", ())
            .map_err(Into::into)
    }

    fn request_permissions(&self) -> Result<bool> {
        #[cfg(not(any(target_os = "android", target_os = "ios")))]
        return Err(Error::UnsupportedPlatform);

        self.0
            .run_mobile_plugin("requestPermissions", ())
            .map_err(Into::into)
    }

    fn check_permissions(&self) -> Result<bool> {
        #[cfg(not(any(target_os = "android", target_os = "ios")))]
        return Err(Error::UnsupportedPlatform);

        self.0
            .run_mobile_plugin("checkPermissions", ())
            .map_err(Into::into)
    }
}
