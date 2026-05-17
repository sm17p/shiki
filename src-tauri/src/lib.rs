// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_media::init())
        .plugin(tauri_plugin_wallpaper::init());

    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_nfc::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
