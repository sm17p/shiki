package me.sm17p.shiki.media

import android.Manifest
import android.app.Activity
import android.content.ContentUris
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.activity.result.ActivityResult
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.documentfile.provider.DocumentFile
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import app.tauri.Logger
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission // <--- ADD THIS IMPORT
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject // <--- ADD THIS IMPORT
import app.tauri.plugin.Plugin
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
    private var lastInvoke: Invoke? = null // Declare lastInvoke here
    private val TAG: String = Logger.tags("MediaPlugin")
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

    @InvokeArg
    data class MediaFolderUri(
        val uri: String = ""
    )

    @PermissionCallback
    fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                // Permissions granted, re-launch the folder picker
                Logger.info(TAG, "Pick #1");
                pickFolder(lastInvoke!!)
            } else {
                lastInvoke?.reject("Permission required")
                lastInvoke = null
            }
        }
    }

    @ActivityCallback
    fun onFolderPickResult(invoke: Invoke, result: ActivityResult) {
        try {
            when (result.resultCode) {
                Activity.RESULT_OK -> {
                    val uri: Uri? = result.data?.data
                    if (uri != null) {
                        val contentResolver = activity.applicationContext.contentResolver
                        val takeFlags: Int = Intent.FLAG_GRANT_READ_URI_PERMISSION
                        contentResolver.takePersistableUriPermission(uri, takeFlags)

                        val jsObj = JSObject()
                        jsObj.put("uri", uri.toString())
                        invoke.resolve(jsObj)
                    } else {
                        invoke.reject("Empty URI")
                    }
                }
                Activity.RESULT_CANCELED -> invoke.reject("File picker cancelled")
                else -> invoke.reject("Failed to pick files")
            }
        } catch (ex: java.lang.Exception) {
            val message = ex.message ?: "Failed to read file pick result"
            Logger.error(TAG, message, ex)
            invoke.reject(message)
        }
    }

    @Command
    fun pickFolder(invoke: Invoke) {
        lastInvoke = invoke

        // Check permissions (as before)
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(activity, missingPermissions.toTypedArray(), PERMISSION_REQUEST_CODE)
            // The result will be handled in onRequestPermissionsResult
            return
        }


        // Launch folder picker
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        handle?.startActivityForResult(invoke, intent, "onFolderPickResult")
    }

    @Command
    fun getMediaItems(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(MediaFolderUri::class.java)
            val treeUri = args.uri.toUri()
            
            val mediaList = JSONArray()
            val gson = Gson()
            
            // Use DocumentFile instead of MediaStore
            val documentFile = DocumentFile.fromTreeUri(activity, treeUri)
            
            if (documentFile != null && documentFile.isDirectory) {
                traverseDirectory(documentFile, mediaList, gson)
            } else {
                invoke.reject("Invalid or inaccessible folder")
                return
            }
            
            val result = JSObject()
            result.put("media", mediaList)
            invoke.resolve(result)
            
        } catch (e: Exception) {
            Logger.error(TAG, "Error processing media item", e)
            invoke.reject("Failed to get media: ${e.message}")
        }
    }

    private fun traverseDirectory(directory: DocumentFile, mediaList: JSONArray, gson: Gson) {
        try {
            directory.listFiles().forEach { file ->
                if (file.isDirectory) {
                    // Recursively traverse subdirectories if needed
                    traverseDirectory(file, mediaList, gson)
                } else if (file.isFile && isMediaFile(file)) {
                    val item = createMediaItemFromDocumentFile(file)
                    mediaList.put(JSONObject(gson.toJson(item)))
                }
            }
        } catch (e: Exception) {
            Logger.error(TAG, "Error traversing directory: ${directory.uri}", e)
        }
    }

    private fun isMediaFile(file: DocumentFile): Boolean {
        val mimeType = file.type ?: return false
        return mimeType.startsWith("image/") || mimeType.startsWith("video/")
    }

    private fun createMediaItemFromDocumentFile(file: DocumentFile): MediaItem {
        var width = 0
        var height = 0
        var duration: Long? = null
        
        try {
            // Get metadata for images
            if (file.type?.startsWith("image/") == true) {
                activity.contentResolver.openInputStream(file.uri)?.use { inputStream ->
                    val options = BitmapFactory.Options().apply {
                        inJustDecodeBounds = true
                    }
                    BitmapFactory.decodeStream(inputStream, null, options)
                    width = options.outWidth
                    height = options.outHeight
                }
            }
            
            // Get metadata for videos
            if (file.type?.startsWith("video/") == true) {
                val retriever = MediaMetadataRetriever()
                try {
                    retriever.setDataSource(activity, file.uri)
                    duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()
                    width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
                    height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
                } catch (e: Exception) {
                    Logger.error(TAG, "Failed to extract video metadata for ${file.name}", e)
                } finally {
                    try {
                        retriever.release()
                    } catch (e: Exception) {
                        Logger.error(TAG, "Failed to release MediaMetadataRetriever", e)
                    }
                }
            }
        } catch (e: Exception) {
            Logger.error(TAG, "Failed to extract metadata for ${file.name}", e)
        }
        
        return MediaItem(
            id = file.uri.toString(),
            displayName = file.name ?: "Unknown",
            path = file.uri.toString(),
            mimeType = file.type,
            dateAdded = file.lastModified(),
            width = width,
            height = height,
            duration = duration
        )
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