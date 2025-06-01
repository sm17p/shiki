use crate::error::Result;
use serde::{Deserialize, Serialize};
use tauri::Runtime; // Import your custom Result from the error module

// This struct defines the data shape for a media item, common for all platforms
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MediaItem {
    pub id: String,
    pub display_name: Option<String>,
    pub path: String, // This will be content:// URI on Android, file:// URL on iOS
    pub mime_type: Option<String>,
    pub date_added: u64, // Unix timestamp (seconds)
    pub width: u32,
    pub height: u32,
    pub duration: Option<u64>, // In milliseconds, for videos
}

// A common trait that defines the plugin's API for mobile platforms
pub trait MediaExt<R: Runtime> {
    fn get_media_items(&self, uri: String) -> Result<MediaResponse>;
    fn request_permissions(&self) -> Result<PermissionResult>;
    fn check_permissions(&self) -> Result<PermissionResult>;
    fn pick_folder(&self) -> Result<FolderPath>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Important! This maps "granted" in Kotlin to "granted" in Rust
pub struct PermissionResult {
    pub granted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Important! This maps "granted" in Kotlin to "granted" in Rust
pub struct FolderPath {
    pub uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Important! This maps "granted" in Kotlin to "granted" in Rust
pub struct MediaResponse {
    pub media: Vec<MediaItem>,
}

