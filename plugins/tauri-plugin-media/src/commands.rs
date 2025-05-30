// src/commands.rs
// use crate::error::{Error, Result}; // Import both Error and Result
use crate::{MediaExt, ModelsMediaExt};
use crate::error::Result;
use crate::Media;
use crate::models::MediaItem;
use tauri::{AppHandle, Runtime, State};


#[tauri::command]
pub(crate) async fn get_all_media<R: Runtime>(
    _app: AppHandle<R>,
     media: State<'_, Media<R>>,
) -> Result<Vec<MediaItem>> {
    media.get_media_items()
}

#[tauri::command]
pub async fn check_media_permissions<R: Runtime>(
    _app: AppHandle<R>,
     media: State<'_, Media<R>>,
) -> Result<bool> {
    media.check_permissions()
}



#[tauri::command]
pub async fn request_media_permissions<R: Runtime>(
    _app: AppHandle<R>,
     media: State<'_, Media<R>>,
) -> Result<bool> {
    media.request_permissions()
}
