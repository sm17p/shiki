use crate::error::Error;

#[cfg(desktop)]
use tauri::{
    AppHandle, Runtime,
    plugin::{PluginApi, PluginHandle},
};

#[cfg(desktop)]
use crate::models::{
    FolderPath, ImageLoadRequest, ImageLoadResponse, MediaExt as ModelsMediaExt, MediaResponse,
    PermissionResult,
};

#[cfg(desktop)]
pub fn init<R: Runtime, C: serde::de::DeserializeOwned>(
    _app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> Result<Media<R>, Error> {
    Err(Error::UnsupportedPlatform)
}

#[cfg(desktop)]
pub struct Media<R: Runtime>(PluginHandle<R>);

#[cfg(desktop)]
impl<R: Runtime> ModelsMediaExt<R> for Media<R> {
    fn get_media_items(&self, _uri: String) -> Result<MediaResponse, Error> {
        Err(Error::UnsupportedPlatform)
    }

    fn request_permissions(&self) -> Result<PermissionResult, Error> {
        Err(Error::UnsupportedPlatform)
    }

    fn check_permissions(&self) -> Result<PermissionResult, Error> {
        Err(Error::UnsupportedPlatform)
    }

    fn pick_folder(&self) -> Result<FolderPath, Error> {
        Err(Error::UnsupportedPlatform)
    }

    fn load_image_data(&self, _args: ImageLoadRequest) -> Result<ImageLoadResponse, Error> {
        Err(Error::UnsupportedPlatform)
    }
}
