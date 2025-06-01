use super::{MediaItem, PermissionStatus};
use std::path::PathBuf;
use windows::Win32::UI::Shell::{FOLDERID_Pictures, FOLDERID_Videos, SHGetKnownFolderPath, KF_FLAG_DEFAULT};
use windows::Win32::Foundation::PWSTR;

pub fn check_permissions_windows() -> Result<PermissionStatus, String> {
    // Windows desktop apps don't have explicit runtime prompts for "Pictures" or "Videos" library access
    // in the same way mobile apps do. Access is typically granted by default for user's own files.
    // If the app is sandboxed (e.g., UWP), permissions are managed differently.
    // For a standard Win32 Tauri app, file system access is usually implicit.
    Ok(PermissionStatus { granted: true, status: "granted".to_string(), message: "File system access is generally granted on Windows desktop.".to_string() })
}

pub fn request_permissions_windows() -> Result<PermissionStatus, String> {
    // No direct system prompt to request file system access on Windows desktop.
    // User manages this via Windows Settings -> Privacy & security -> File system.
    Ok(PermissionStatus { granted: true, status: "granted".to_string(), message: "Permissions are managed by user settings on Windows.".to_string() })
}

pub fn get_media_items_windows() -> Result<MediaResponse, String> {
    let mut items = Vec::new();

    // Get Pictures folder path
    let pictures_path_ptr: PWSTR = unsafe { SHGetKnownFolderPath(&FOLDERID_Pictures, KF_FLAG_DEFAULT, None)? };
    let pictures_dir = unsafe { PathBuf::from(pictures_path_ptr.to_string().unwrap_or_default()) };
    unsafe { windows::Win32::System::Com::CoTaskMemFree(pictures_path_ptr.0 as *mut std::ffi::c_void); }

    // Get Videos folder path
    let videos_path_ptr: PWSTR = unsafe { SHGetKnownFolderPath(&FOLDERID_Videos, KF_FLAG_DEFAULT, None)? };
    let videos_dir = unsafe { PathBuf::from(videos_path_ptr.to_string().unwrap_or_default()) };
    unsafe { windows::Win32::System::Com::CoTaskMemFree(videos_path_ptr.0 as *mut std::ffi::c_void); }


    // Function to recursively read directory
    fn read_dir_recursive(dir: &PathBuf, items: &mut MediaResponse) -> Result<(), String> {
        for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() {
                let _ = read_dir_recursive(&path, items);
            } else if path.is_file() {
                if let Some(extension) = path.extension().and_then(|s| s.to_str()) {
                    let mime_type = match extension.to_lowercase().as_str() {
                        "jpg" | "jpeg" | "png" | "gif" | "bmp" => "image/jpeg".to_string(),
                        "mp4" | "mov" | "avi" | "wmv" | "mkv" => "video/mp4".to_string(),
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