use tauri::{
    Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};

mod commands;
#[cfg(desktop)]
mod desktop;
mod error;
#[cfg(mobile)]
mod mobile;
mod models;

pub use crate::models::{MediaExt as ModelsMediaExt, MediaItem}; // Alias to avoid name collision with your top-level MediaExt trait

#[cfg(desktop)]
use desktop::Media;
#[cfg(mobile)]
use mobile::Media;

// / Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the media APIs.
pub trait MediaExt<R: Runtime> {
    fn media(&self) -> &Media<R>;
}

// Implement MediaExt for AppHandle, Window (any Manager type)
impl<R: Runtime, T: Manager<R>> MediaExt<R> for T {
    fn media(&self) -> &Media<R> {
        self.state::<Media<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("notification")
        .invoke_handler(tauri::generate_handler![
            commands::get_all_media,
            commands::check_media_permissions,
            commands::request_media_permissions
        ])
        // .js_init_script(include_str!("init-iife.js").replace(
        //     "__TEMPLATE_windows__",
        //     if cfg!(windows) { "true" } else { "false" },
        // ))
        .setup(|app, api| {
            #[cfg(mobile)]
            let media = mobile::init(app, api)?;
            #[cfg(desktop)]
            let media = desktop::init(app, api)?;
            app.manage(media);
            Ok(())
        })
        .build()
}
