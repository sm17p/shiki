import SwiftRs
import Tauri
import Photos
import MobileCoreServices // For UTType to MimeType conversion
import Foundation // For URL, Date, etc.

@objc(MediaPlugin)
class MediaPlugin: NSObject, TauriPlugin {
    var bridge: TauriBridge! // The TauriBridge instance is implicitly available

    // Define MediaItem structure to match Rust/JS
    struct MediaItem: Codable {
        let id: String
        let displayName: String?
        let path: String
        let mimeType: String?
        let dateAdded: Int // Unix timestamp
        let width: Int
        let height: Int
        let duration: Int? // In milliseconds, for videos
    }

    // MARK: - Plugin Commands

    @objc(getMediaItems:)
    func getMediaItems(invoke: Invoke) {
        PHPhotoLibrary.requestAuthorization { status in
            if status == .authorized {
                self.queryMediaItems { items, error in
                    if let items = items {
                        do {
                            let encoder = JSONEncoder()
                            let data = try encoder.encode(items)
                            if let jsonString = String(data: data, encoding: .utf8) {
                                invoke.resolve(jsonString)
                            } else {
                                invoke.reject("Failed to convert media items to JSON string")
                            }
                        } catch {
                            invoke.reject("Failed to encode media items to JSON: \(error.localizedDescription)")
                        }
                    } else if let error = error {
                        invoke.reject("Error querying media items: \(error.localizedDescription)")
                    } else {
                        invoke.reject("Unknown error querying media items")
                    }
                }
            } else {
                invoke.reject("Photo library access denied.")
            }
        }
    }

    @objc(requestPermissions:)
    func requestPermissions(invoke: Invoke) {
        PHPhotoLibrary.requestAuthorization { status in
            invoke.resolve(status == .authorized)
        }
    }

    @objc(checkPermissions:)
    func checkPermissions(invoke: Invoke) {
        let status = PHPhotoLibrary.authorizationStatus()
        invoke.resolve(status == .authorized)
    }

    // MARK: - Private Helpers

    private func queryMediaItems(completion: @escaping ([MediaItem]?, Error?) -> Void) {
        var mediaItems: [MediaItem] = []
        let fetchOptions = PHFetchOptions()
        fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]

        let allAssets = PHAsset.fetchAssets(with: fetchOptions)

        let group = DispatchGroup()
        let lock = NSLock() // To protect mediaItems array from concurrent modification

        allAssets.enumerateObjects { asset, _, _ in
            group.enter()
            DispatchQueue.global(qos: .userInitiated).async {
                self.processAsset(asset: asset) { item in
                    lock.lock()
                    if let item = item {
                        mediaItems.append(item)
                    }
                    lock.unlock()
                    group.leave()
                }
            }
        }

        group.notify(queue: .main) {
            completion(mediaItems, nil)
        }
    }

    private func processAsset(asset: PHAsset, completion: @escaping (MediaItem?) -> Void) {
        guard let localIdentifier = asset.localIdentifier.components(separatedBy: "/").first else {
            completion(nil)
            return
        }

        let mimeType = getMimeType(forAsset: asset)
        let dateAdded = Int(asset.creationDate?.timeIntervalSince1970 ?? 0)

        // For image and video, we need to get their URL
        let options = PHContentEditingInputRequestOptions()
        options.canHandleLivePhotos = false // For simpler URL fetching

        asset.requestContentEditingInput(with: options) { contentEditingInput, info in
            guard let url = contentEditingInput?.fullSizeImageURL ?? contentEditingInput?.videoURL else {
                completion(nil)
                return
            }

            let path = url.absoluteString

            let item = MediaItem(
                id: localIdentifier,
                displayName: asset.originalFilename, // PHAsset extension for filename
                path: path,
                mimeType: mimeType,
                dateAdded: dateAdded,
                width: asset.pixelWidth,
                height: asset.pixelHeight,
                duration: asset.mediaType == .video ? Int(asset.duration * 1000) : nil
            )
            completion(item)
        }
    }

    // Helper to get MIME type from PHAsset media type and subtype
    private func getMimeType(forAsset asset: PHAsset) -> String? {
        if asset.mediaType == .image {
            return "image/jpeg" // Default, can be more specific with PHAssetResource
        } else if asset.mediaType == .video {
            return "video/mp4" // Default
        }
        return nil
    }
}

// MARK: - PHAsset Extension for originalFilename
extension PHAsset {
    var originalFilename: String? {
        return PHAssetResource.assetResources(for: self).first?.originalFilename
    }
}


@_cdecl("init_plugin_media")
func initPlugin() -> Plugin {
  return MediaPlugin()
}
