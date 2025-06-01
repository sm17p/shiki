use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Wallpaper;
#[cfg(mobile)]
use mobile::Wallpaper;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the wallpaper APIs.
pub trait WallpaperExt<R: Runtime> {
  fn wallpaper(&self) -> &Wallpaper<R>;
}

impl<R: Runtime, T: Manager<R>> crate::WallpaperExt<R> for T {
  fn wallpaper(&self) -> &Wallpaper<R> {
    self.state::<Wallpaper<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("wallpaper")
    .invoke_handler(tauri::generate_handler![commands::ping])
    .setup(|app, api| {
      #[cfg(mobile)]
      let wallpaper = mobile::init(app, api)?;
      #[cfg(desktop)]
      let wallpaper = desktop::init(app, api)?;
      app.manage(wallpaper);
      Ok(())
    })
    .build()
}
