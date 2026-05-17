const COMMANDS: &[&str] = &["set_wallpaper", "get_wallpaper_info", "check_permissions"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
