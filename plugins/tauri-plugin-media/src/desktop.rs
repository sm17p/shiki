use std::path;

use crate::{error::{Error, Result};
use serde::de::DeserializeOwned;
use tauri::{
    AppHandle, Runtime,
    plugin::{PluginApi, PluginHandle},
}; // Import both Error and Result;
use crate::models::{MediaExt as ModelsMediaExt, MediaResponse, PermissionResult, FolderPath};

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> Result<Media<R>> {
    Err(Error::UnsupportedPlatform)
}

/// Access to the media APIs.#[cfg(mobile)]
pub struct Media<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> ModelsMediaExt<R> for Media<R> {
    fn get_media_items(&self, uri: String) -> Result<MediaResponse> {
        Err(Error::UnsupportedPlatform)
    }

    fn request_permissions(&self) -> Result<PermissionResult> {
        Err(Error::UnsupportedPlatform)
    }

    fn check_permissions(&self) -> Result<PermissionResult> {
        Err(Error::UnsupportedPlatform)
    }

    fn pick_folder(&self) -> Result<crate::models::FolderPath> {
        Err(Error::UnsupportedPlatform)
    }
}