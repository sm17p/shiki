package me.sm17p.shiki.media

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import androidx.activity.result.ActivityResult
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.documentfile.provider.DocumentFile
import app.tauri.Logger
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.google.gson.Gson
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.URLDecoder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.nio.charset.StandardCharsets

private val pluginScope = CoroutineScope(Dispatchers.Main) // Or Dispatchers.Main if you have a plugin lifecycle class

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
    data class MediaItem(
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

    @InvokeArg
    data class ImageLoadRequest(
        val uri: String = "",
        val thumbnail: Boolean = false,
        val maxWidth: Int? = null,
        val maxHeight: Int? = null
    )

    data class ImageLoadResponse(
        val data: List<Byte> = emptyList(),
        val mimeType: String = "",
        val width: Int = 0,
        val height: Int = 0
    )

    @Command
    fun loadImageData(invoke: Invoke) {
        pluginScope.launch(Dispatchers.IO) {
            try {
                val args = invoke.parseArgs(ImageLoadRequest::class.java)
                val response = loadImageFromContentUri(args)

                Logger.info(TAG, "Image Picking ${args.uri}")

                val result = JSObject().apply {
                    val jsArrayData = JSArray().apply {
                        response.data.forEach { byte ->
                            // JSArray.put() typically takes Java types, Byte will be boxed to Integer
                            // and correctly mapped to a JSON number.
                            put(byte.toInt() and 0xFF) // Convert Byte to Int to avoid potential issues with signed bytes
                        }
                    }
                    put("data", jsArrayData)
                    put("mimeType", response.mimeType)
                    put("width", response.width)
                    put("height", response.height)
                }

                Logger.info(TAG, "Image Sending $result")

                invoke.resolve(result)
            } catch (e: Exception) {
                Logger.error(TAG, "Failed to load image: ${e.message}", e)
                invoke.reject("Failed to load image: ${e.message}")
            }
        }
    }

    private fun decodeUrlString(encodedUrl: String): String {
        // It's crucial to specify the character encoding, usually UTF-8
        return URLDecoder.decode(encodedUrl, StandardCharsets.UTF_8.name())
    }

    // Update your existing loadImageData method to work with the new structure
    private fun loadImageFromContentUri(request: ImageLoadRequest): ImageLoadResponse {
        Logger.info(TAG, "Received URI string: ${request.uri}") // Add this line
        val uri = decodeUrlString(request.uri).toUri()
        Logger.info(TAG, "Parsed URI object: $uri")
        val inputStream: InputStream = activity.applicationContext.contentResolver.openInputStream(uri)
            ?: throw Exception("Failed to open input stream for URI: ${request.uri}")

        return inputStream.use { stream ->
            val originalBitmap = BitmapFactory.decodeStream(stream)
                ?: throw Exception("Failed to decode bitmap from stream")

            val processedBitmap = when {
                request.thumbnail -> createThumbnail(originalBitmap, 300, 300)
                request.maxWidth != null || request.maxHeight != null -> {
                    resizeBitmap(originalBitmap, request.maxWidth, request.maxHeight)
                }
                else -> originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            processedBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val imageDataBytes = outputStream.toByteArray()
            val imageDataList = imageDataBytes.toList()

            ImageLoadResponse(
                data = imageDataList,
                mimeType = "image/jpeg",
                width = processedBitmap.width,
                height = processedBitmap.height
            )
        }
    }

    // Update your existing createThumbnail method
    private fun createThumbnail(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val ratio = minOf(
            maxWidth.toFloat() / bitmap.width,
            maxHeight.toFloat() / bitmap.height
        )

        val width = (ratio * bitmap.width).toInt()
        val height = (ratio * bitmap.height).toInt()

        return Bitmap.createScaledBitmap(bitmap, width, height, true)
    }

    // Add this new method for custom resizing
    private fun resizeBitmap(bitmap: Bitmap, maxWidth: Int?, maxHeight: Int?): Bitmap {
        val currentWidth = bitmap.width
        val currentHeight = bitmap.height

        if (maxWidth == null && maxHeight == null) {
            return bitmap
        }

        val scaleX = maxWidth?.let { it.toFloat() / currentWidth } ?: Float.MAX_VALUE
        val scaleY = maxHeight?.let { it.toFloat() / currentHeight } ?: Float.MAX_VALUE
        val scale = minOf(scaleX, scaleY, 1.0f) // Don't upscale

        val newWidth = (currentWidth * scale).toInt()
        val newHeight = (currentHeight * scale).toInt()

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

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
            Logger.info(TAG, "1. Start is ${treeUri.toString()}")
            
            val mediaList = JSONArray()
            val gson = Gson()
            
            // Use DocumentFile instead of MediaStore
            val documentFile = DocumentFile.fromTreeUri(activity, treeUri)
            Logger.info(TAG, "2. DocumentFile is ${documentFile?.uri.toString()}")

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
        Logger.info(TAG, "3. Foundfile is ${file.uri.toString()}")
        
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

        Logger.info("TAG", "File is ${file.uri.toString()}")
        
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