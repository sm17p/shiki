use crate::error::{Error, Result};
use serde::de::DeserializeOwned;
use tauri::{
    AppHandle, Runtime,
    plugin::{PluginApi, PluginHandle},
}; // Import both Error and Result;
use crate::models::{MediaExt as ModelsMediaExt, MediaItem};

pub fn init<R: Runtime + Send, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> Result<Media<R>> {
    Err(Error::UnsupportedPlatform)
}

/// Access to the media APIs.#[cfg(mobile)]
pub struct Media<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> ModelsMediaExt<R> for Media<R> {
    fn get_media_items(&self) -> Result<Vec<MediaItem>> {
        Err(Error::UnsupportedPlatform)
    }

    fn request_permissions(&self) -> Result<bool> {
        Err(Error::UnsupportedPlatform)
    }

    fn check_permissions(&self) -> Result<bool> {
        Err(Error::UnsupportedPlatform)
    }
}