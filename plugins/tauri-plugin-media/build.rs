const COMMANDS: &[&str] = &["get_all_media", "check_media_permissions", "request_media_permissions"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
