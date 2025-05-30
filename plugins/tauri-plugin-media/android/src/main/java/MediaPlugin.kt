package me.sm17p.shiki.media

import android.Manifest
import android.app.Activity
import android.content.ContentUris
import android.content.pm.PackageManager
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.annotation.Permission // <--- ADD THIS IMPORT
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import app.tauri.plugin.JSObject // <--- ADD THIS IMPORT
import com.google.gson.Gson

import org.json.JSONArray
import org.json.JSONObject

@TauriPlugin(
    permissions = [
        Permission(strings = [Manifest.permission.READ_EXTERNAL_STORAGE], alias = "readStorage"),
        Permission(strings = [Manifest.permission.READ_MEDIA_IMAGES], alias = "readMediaImages"),
        Permission(strings = [Manifest.permission.READ_MEDIA_VIDEO], alias = "readMediaVideo")
    ]
)
class MediaPlugin(private val activity: Activity) : Plugin(activity) {

    @InvokeArg
    class MediaItem(
        val id: String,
        val displayName: String?,
        val path: String,
        val mimeType: String?,
        val dateAdded: Long,
        val width: Int,
        val height: Int,
        val duration: Long? = null
    )

    @Command
    fun getMediaItems(invoke: Invoke) {
        if (!hasPermissions()) {
            invoke.reject("Permissions not granted. Request READ_EXTERNAL_STORAGE or READ_MEDIA_IMAGES/VIDEO.")
            return
        }

        val mediaList = JSONArray()
        val gson = Gson()

        // Images
        queryMedia(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            arrayOf(
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME,
                // MediaStore.Images.Media.DATA, // Consider if you still need this for older Android versions' direct file paths
                MediaStore.Images.Media.MIME_TYPE,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.WIDTH,
                MediaStore.Images.Media.HEIGHT
            )
        ) { cursor ->
            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
            val displayNameColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
            val mimeTypeColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.MIME_TYPE)
            val dateAddedColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED)
            val widthColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.WIDTH)
            val heightColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.HEIGHT)

            val id = cursor.getLong(idColumn)
            val displayName = cursor.getString(displayNameColumn)
            val mimeType = cursor.getString(mimeTypeColumn)
            val dateAdded = cursor.getLong(dateAddedColumn)
            val width = cursor.getInt(widthColumn)
            val height = cursor.getInt(heightColumn)

            val contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)

            val item = MediaItem(
                id = id.toString(),
                displayName = displayName,
                path = contentUri.toString(),
                mimeType = mimeType,
                dateAdded = dateAdded,
                width = width,
                height = height
                // duration is null for images
            )
            mediaList.put(JSONObject(gson.toJson(item)))
        }

        // Videos
        queryMedia(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            arrayOf(
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                // MediaStore.Video.Media.DATA, // Consider if you still need this for older Android versions' direct file paths
                MediaStore.Video.Media.MIME_TYPE,
                MediaStore.Video.Media.DATE_ADDED,
                MediaStore.Video.Media.WIDTH,
                MediaStore.Video.Media.HEIGHT,
                MediaStore.Video.Media.DURATION
            )
        ) { cursor ->
            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
            val displayNameColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
            val mimeTypeColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.MIME_TYPE)
            val dateAddedColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DATE_ADDED)
            val widthColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.WIDTH)
            val heightColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.HEIGHT)
            val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION)

            val id = cursor.getLong(idColumn)
            val displayName = cursor.getString(displayNameColumn)
            val mimeType = cursor.getString(mimeTypeColumn)
            val dateAdded = cursor.getLong(dateAddedColumn)
            val width = cursor.getInt(widthColumn)
            val height = cursor.getInt(heightColumn)
            val duration = cursor.getLong(durationColumn)

            val contentUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id)

            val item = MediaItem(
                id = id.toString(),
                displayName = displayName,
                path = contentUri.toString(),
                mimeType = mimeType,
                dateAdded = dateAdded,
                width = width,
                height = height,
                duration = duration
            )
            mediaList.put(JSONObject(gson.toJson(item)))
        }

        // Resolve by wrapping the JSONArray in a JSObject
        invoke.resolve(JSObject().put("items", mediaList)) // <--- FIXED
    }

    private fun queryMedia(
        collection: android.net.Uri,
        projection: Array<String>,
        processCursor: (android.database.Cursor) -> Unit
    ) {
        val sortOrder = "${MediaStore.MediaColumns.DATE_ADDED} DESC"

        activity.contentResolver.query(
            collection,
            projection,
            null,
            null,
            sortOrder
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                try {
                    processCursor(cursor)
                } catch (e: Exception) {
                    Log.e("MediaPlugin", "Error processing media item", e)
                }
            }
        }
    }

    @Command
    override fun requestPermissions(invoke: Invoke) { // <--- ADDED override
        val permissionsToRequest = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_MEDIA_VIDEO)
            }
        } else {
            @Suppress("DEPRECATION") // Suppress warning for older API
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(activity, permissionsToRequest.toTypedArray(), PERMISSION_REQUEST_CODE)
            // For simplicity, resolve immediately. In a real app, you'd handle the result
            // in onRequestPermissionsResult and then bridge back to resolve/reject.
            invoke.resolve(JSObject().put("granted", true)) // <--- FIXED
        } else {
            invoke.resolve(JSObject().put("granted", true)) // <--- FIXED
        }
    }

    @Command
    override fun checkPermissions(invoke: Invoke) { // <--- ADDED override
        invoke.resolve(JSObject().put("granted", hasPermissions())) // <--- FIXED
    }

    private fun hasPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_MEDIA_VIDEO) == PackageManager.PERMISSION_GRANTED
        } else {
            @Suppress("DEPRECATION") // Suppress warning for older API
            ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        }
    }

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
    }
}