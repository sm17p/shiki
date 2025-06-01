// plugins/tauri-plugin-media/src-tauri/src/linux.rs

use super::{MediaItem, PermissionStatus};
use error::{Result};
use std::path::PathBuf;

pub fn check_permissions_linux() -> Result<PermissionStatus> {
    // Linux desktop apps rely on standard file system permissions.
    // There's no central "media library" permission system like Android/macOS.
    Ok(PermissionStatus { granted: true, status: "granted".to_string(), message: "File system access relies on user permissions.".to_string() })
}

pub fn request_permissions_linux() -> Result<PermissionStatus> {
    // No direct system prompt to request file system access on Linux.
    // User manages this via file permissions or desktop environment settings.
    Ok(PermissionStatus { granted: true, status: "granted".to_string(), message: "Permissions are managed by file system access on Linux.".to_string() })
}

pub fn get_media_items_linux() -> Result<MediaResponse> {
    let mut items = Vec::new();

    // Use XDG Base Directory Specification for common user directories
    let pictures_dir = xdg::BaseDirectories::with_prefix("").map_err(|e| e.to_string())?
                                .find_data_file("Pictures")
                                .unwrap_or_else(|| PathBuf::from("/home").join(std::env::var("USER").unwrap_or_default()).join("Pictures"));

    let videos_dir = xdg::BaseDirectories::with_prefix("").map_err(|e| e.to_string())?
                                .find_data_file("Videos")
                                .unwrap_or_else(|| PathBuf::from("/home").join(std::env::var("USER").unwrap_or_default()).join("Videos"));

    // Function to recursively read directory (same as macOS)
    fn read_dir_recursive(dir: &PathBuf, items: &mut MediaResponse) -> Result<()> {
        for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() {
                let _ = read_dir_recursive(&path, items);
            } else if path.is_file() {
                if let Some(extension) = path.extension().and_then(|s| s.to_str()) {
                    let mime_type = match extension.to_lowercase().as_str() {
                        "jpg" | "jpeg" | "png" | "gif" | "bmp" => "image/jpeg".to_string(),
                        "mp4" | "mov" | "avi" | "mkv" | "webm" => "video/mp4".to_string(),
                        _ => continue,
                    };

                    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
                    let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("unknown").to_string();
                    let date_added = metadata.created().map_err(|e| e.to_string())?
                                            .duration_since(std::time::UNIX_EPOCH).map_err(|e| e.to_string())?
                                            .as_secs() as i64;

                    let (width, height, duration) = (0, 0, None); // Placeholders

                    items.push(MediaItem {
                        id: path.to_string_lossy().to_string(),
                        displayName: file_name,
                        path: format!("file://{}", path.to_string_lossy()),
                        mimeType: mime_type,
                        dateAdded: date_added,
                        width: width,
                        height: height,
                        duration: duration,
                        thumbnailPath: format!("file://{}", path.to_string_lossy()), // Placeholder
                    });
                }
            }
        }
        Ok(())
    }

    let _ = read_dir_recursive(&pictures_dir, &mut items);
    let _ = read_dir_recursive(&videos_dir, &mut items);

    Ok(items)
}