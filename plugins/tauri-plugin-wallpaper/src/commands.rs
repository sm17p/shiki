use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::WallpaperExt;

// in src/plugin.rs
#[command]
async fn set_wallpaper_internal(app: tauri::AppHandle, image_path: String) -> Result<(), String> {
    app.plugin("wallpaper")? // Replace "wallpaper" with your plugin's ID
       .send_notification("set_wallpaper")? // The name of your Kotlin command
       .data(serde_json::json!({ "imagePath": image_path })) // Pass data to Kotlin
       .submit()?;
    Ok(()) // Or handle result from Kotlin
}