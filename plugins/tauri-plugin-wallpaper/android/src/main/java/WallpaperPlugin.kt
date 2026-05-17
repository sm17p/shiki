package me.sm17p.shiki.wallpaper

import android.Manifest
import android.app.Activity
import android.app.WallpaperManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.ByteArrayInputStream
import java.io.IOException

@TauriPlugin(
    permissions = [
        Permission(strings = [Manifest.permission.SET_WALLPAPER], alias = "setWallpaper")
    ]
)
class WallpaperPlugin(private val activity: Activity) : Plugin(activity) {

    private val wallpaperManager: WallpaperManager = WallpaperManager.getInstance(activity)
    private var screenUnlockReceiver: BroadcastReceiver? = null

    @InvokeArg
    data class WallpaperOptions(
        val path: String = "",
        val screen: String? = null,
        val mode: String? = null
    )

    override fun load(webView: WebView) {
        super.load(webView)
        registerScreenUnlockReceiver()
    }

    override fun onDestroy(activity: AppCompatActivity) {
        unregisterScreenUnlockReceiver()
        super.onDestroy(activity)
    }

    private fun registerScreenUnlockReceiver() {
        if (screenUnlockReceiver != null) {
            return
        }

        screenUnlockReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action != Intent.ACTION_USER_PRESENT) {
                    return
                }

                trigger(
                    "screenUnlocked",
                    JSObject().put("timestamp", System.currentTimeMillis())
                )
            }
        }

        val filter = IntentFilter(Intent.ACTION_USER_PRESENT)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(screenUnlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            activity.registerReceiver(screenUnlockReceiver, filter)
        }
    }

    private fun unregisterScreenUnlockReceiver() {
        val receiver = screenUnlockReceiver ?: return
        screenUnlockReceiver = null

        try {
            activity.unregisterReceiver(receiver)
        } catch (e: IllegalArgumentException) {
            Log.w("WallpaperPlugin", "Screen unlock receiver was already unregistered.", e)
        }
    }

    @Command
    fun setWallpaper(invoke: Invoke) {
        val options = invoke.parseArgs(WallpaperOptions::class.java)
        val imagePath = options.path

        if (imagePath.isBlank()) {
            invoke.reject("Image path is required.")
            return
        }

        try {
            val imageUri = Uri.parse(imagePath)
            val bytes = activity.contentResolver.openInputStream(imageUri)?.use { stream ->
                stream.readBytes()
            }

            if (bytes == null) {
                invoke.reject("Failed to open input stream for image: $imagePath. Check path validity and read permissions.")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                when (options.screen?.lowercase()) {
                    "lock", "lockscreen" -> setStream(bytes, WallpaperManager.FLAG_LOCK)
                    "home", "main", "system" -> setStream(bytes, WallpaperManager.FLAG_SYSTEM)
                    else -> {
                        setStream(bytes, WallpaperManager.FLAG_SYSTEM)
                        setStream(bytes, WallpaperManager.FLAG_LOCK)
                    }
                }
            } else {
                wallpaperManager.setStream(ByteArrayInputStream(bytes))
            }

            invoke.resolve()
            Log.d("WallpaperPlugin", "Wallpaper set successfully from: $imagePath")
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

    private fun setStream(bytes: ByteArray, which: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            wallpaperManager.setStream(ByteArrayInputStream(bytes), null, true, which)
        } else {
            wallpaperManager.setStream(ByteArrayInputStream(bytes))
        }
    }

    @Command
    fun getWallpaperInfo(invoke: Invoke) {
        invoke.resolve(JSObject().put("path", null).put("screen", null))
    }

    @Command
    override fun checkPermissions(invoke: Invoke) {
        val granted = ContextCompat.checkSelfPermission(activity, Manifest.permission.SET_WALLPAPER) == PackageManager.PERMISSION_GRANTED
        invoke.resolve(JSObject().put("granted", granted))
    }
}
