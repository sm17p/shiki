use crate::{MediaExt, ModelsMediaExt};
use crate::error::Result;
use crate::models::{FolderPath, MediaResponse, PermissionResult};
use tauri::{AppHandle, Runtime};


#[tauri::command]
pub(crate) async fn get_media_items<R: Runtime>(
    app: AppHandle<R>,
    uri: String,
) -> Result<MediaResponse> {
    app.media().get_media_items(uri)
}

#[tauri::command]
pub async fn check_media_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<PermissionResult> {
    app.media().check_permissions()
}

#[tauri::command]
pub async fn request_media_permissions<R: Runtime>(
    app: AppHandle<R>,
) -> Result<PermissionResult> {
    app.media().request_permissions()
}

#[tauri::command]
pub async fn pick_folder<R: Runtime>(
    app: AppHandle<R>,
) -> Result<FolderPath> {
    app.media().pick_folder()
}
