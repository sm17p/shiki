use serde::{Serialize, ser::Serializer};
use std::sync::{MutexGuard, PoisonError};
use tauri;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Tauri(#[from] tauri::Error), // This covers errors from the tauri crate
    #[error("Plugin error: {0}")]
    Plugin(String),
    #[cfg(mobile)]
    #[error(transparent)]
    PluginInvoke(#[from] tauri::plugin::mobile::PluginInvokeError),
    #[error("Platform not supported")]
    UnsupportedPlatform,
    #[error("Permissions not granted: {0}")]
    PermissionsNotGranted(String),
    #[error("Failed to parse JSON: {0}")]
    JsonParseError(String),
    #[error("Mutex poisoned: {0}")] // Add this variant
    Poisoned(String),
}

// For string conversion of MutexGuard
impl<T> From<PoisonError<MutexGuard<'_, T>>> for Error {
    fn from(err: PoisonError<MutexGuard<'_, T>>) -> Self {
        Error::Poisoned(format!("{:?}", err))
    }
}

pub type Result<T> = std::result::Result<T, Error>;

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
