const COMMANDS: &[&str] = &["get_media_items", "check_media_permissions", "request_media_permissions", "pick_folder"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
