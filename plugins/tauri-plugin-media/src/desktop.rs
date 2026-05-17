use crate::error::Error;

#[cfg(desktop)]
use std::{
    fs,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};

#[cfg(desktop)]
use tauri::{AppHandle, Runtime, plugin::PluginApi};

#[cfg(desktop)]
use crate::models::{
    FolderPath, ImageLoadRequest, ImageLoadResponse, MediaExt as ModelsMediaExt, MediaItem,
    MediaResponse, PermissionResult,
};

#[cfg(desktop)]
pub fn init<R: Runtime, C: serde::de::DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> Result<Media<R>, Error> {
    Ok(Media(app.clone()))
}

#[cfg(desktop)]
pub struct Media<R: Runtime>(AppHandle<R>);

#[cfg(desktop)]
fn path_from_uri(uri: &str) -> PathBuf {
    uri.strip_prefix("file://")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(uri))
}

#[cfg(desktop)]
fn is_supported_media(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "apng" | "avif" | "bmp" | "gif" | "jpeg" | "jpg" | "png" | "svg" | "webp"
            )
        })
        .unwrap_or(false)
}

#[cfg(desktop)]
fn collect_media(path: &Path, items: &mut Vec<MediaItem>) -> Result<(), Error> {
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            collect_media(&entry.path(), items)?;
        }

        return Ok(());
    }

    if !path.is_file() || !is_supported_media(path) {
        return Ok(());
    }

    let metadata = fs::metadata(path)?;
    let date_added = metadata
        .modified()
        .ok()
        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    let mime_type = infer::get_from_path(path)
        .ok()
        .flatten()
        .map(|kind| kind.mime_type().to_string());
    let path_string = path.to_string_lossy().to_string();

    items.push(MediaItem {
        id: path_string.clone(),
        display_name: path
            .file_name()
            .map(|name| name.to_string_lossy().to_string()),
        path: format!("file://{path_string}"),
        mime_type,
        date_added,
        width: 0,
        height: 0,
        duration: None,
    });

    Ok(())
}

#[cfg(desktop)]
impl<R: Runtime> ModelsMediaExt<R> for Media<R> {
    fn get_media_items(&self, uri: String) -> Result<MediaResponse, Error> {
        let mut media = Vec::new();
        collect_media(&path_from_uri(&uri), &mut media)?;
        Ok(MediaResponse { media })
    }

    fn request_permissions(&self) -> Result<PermissionResult, Error> {
        Ok(PermissionResult { granted: true })
    }

    fn check_permissions(&self) -> Result<PermissionResult, Error> {
        Ok(PermissionResult { granted: true })
    }

    fn pick_folder(&self) -> Result<FolderPath, Error> {
        Err(Error::UnsupportedPlatform)
    }

    fn pick_media(&self) -> Result<MediaItem, Error> {
        Err(Error::UnsupportedPlatform)
    }

    fn load_image_data(&self, args: ImageLoadRequest) -> Result<ImageLoadResponse, Error> {
        let path = path_from_uri(&args.uri);
        let data = fs::read(&path)?;
        let mime_type = infer::get(&data)
            .map(|kind| kind.mime_type().to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        Ok(ImageLoadResponse {
            data,
            mime_type,
            width: 0,
            height: 0,
        })
    }
}
