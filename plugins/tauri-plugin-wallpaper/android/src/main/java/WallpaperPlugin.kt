package me.sm17p.shiki.wallpaper

import android.Manifest
import android.app.Activity
import android.app.WallpaperManager
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import java.io.InputStream
import java.io.IOException

// Update your plugin's package and class name if it's not `me.sm17p.shiki.wallpaper.WallpaperPlugin`
// in your plugin's AndroidManifest.xml and Cargo.toml.
@TauriPlugin(
    permissions = [
        Permission(strings = [Manifest.permission.SET_WALLPAPER], alias = "setWallpaper")
        // No runtime permission needed for SET_WALLPAPER on modern Android, but declare it.
        // If you're reading images from external storage, you'll need READ_EXTERNAL_STORAGE/READ_MEDIA_IMAGES/VIDEO
    ]
)
class WallpaperPlugin(private val activity: Activity) : Plugin(activity) {

    private val wallpaperManager: WallpaperManager = WallpaperManager.getInstance(activity)

    @Command
    fun setWallpaper(invoke: Invoke) {
        val imagePath = invoke.getString("path") // Use "path" to match Rust's WallpaperOptions
        val mode = invoke.getString("mode") // Optional: "fill", "fit", "stretch", "center", "tile" (implement if WallpaperManager allows)
        val screen = invoke.getString("screen") // Optional: "all", "home", "lock" (implement if WallpaperManager allows)


        if (imagePath == null) {
            invoke.reject("Image path is required.")
            return
        }

        try {
            val imageUri = Uri.parse(imagePath)
            val inputStream: InputStream? = activity.contentResolver.openInputStream(imageUri)

            inputStream?.use { stream ->
                // WallpaperManager.setStream supports various modes (e.g., FLAG_SET_LOCKSCREEN, FLAG_SET_SYSTEM)
                // You'd need to map your 'screen' argument to these flags.
                // For simplicity, let's set system wallpaper by default.
                // For lock screen: wallpaperManager.setStream(stream, null, true, WallpaperManager.FLAG_SET_LOCKSCREEN)
                // For home screen: wallpaperManager.setStream(stream, null, true, WallpaperManager.FLAG_SET_SYSTEM)
                // For both (often default if only one flag is given for specific API levels):
                wallpaperManager.setStream(stream)

                invoke.resolve()
                Log.d("WallpaperPlugin", "Wallpaper set successfully from: $imagePath")
            } ?: run {
                invoke.reject("Failed to open input stream for image: $imagePath. Check path validity and read permissions.")
            }
        } catch (e: SecurityException) {
            Log.e("WallpaperPlugin", "Security Exception: Check if SET_WALLPAPER permission is declared in AndroidManifest.xml.", e)
            invoke.reject("Permission denied: ${e.message}. Ensure SET_WALLPAPER is in manifest.")
        } catch (e: IOException) {
            Log.e("WallpaperPlugin", "IO Exception setting wallpaper", e)
            invoke.reject("IO Error setting wallpaper: ${e.message}")
        } catch (e: Exception) {
            Log.e("WallpaperPlugin", "Error setting wallpaper", e)
            invoke.reject("Failed to set wallpaper: ${e.message}")
        }
    }

    // Android's WallpaperManager doesn't easily expose the current wallpaper path.
    // It returns Drawables or Bitmaps. Implementing getWallpaperInfo is complex.
    @Command
    fun getWallpaperInfo(invoke: Invoke) {
        invoke.reject("Getting wallpaper info is not directly supported on Android due to API limitations.")
    }

    // You might still want checkPermissions for any other permissions your plugin might need later.
    @Command
    override fun checkPermissions(invoke: Invoke) {
        val granted = ContextCompat.checkSelfPermission(activity, Manifest.permission.SET_WALLPAPER) == PackageManager.PERMISSION_GRANTED
        invoke.resolve(JSObject().put("granted", granted))
    }
}