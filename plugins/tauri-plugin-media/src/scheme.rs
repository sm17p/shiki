use crate::error::Result;
use crate::models::ImageLoadRequest;
use log;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::http::{Request, Response, status::StatusCode};
use tauri::{Manager, Runtime, State, UriSchemeContext, UriSchemeResponder, Url};

use crate::{MediaExt, ModelsMediaExt};

// Protocol handler for shiki://image/* URLs
pub fn handle_shiki_protocol<R: Runtime + 'static>(
    ctx: UriSchemeContext<'_ , R>,
    request: tauri::http::Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let app_handle = ctx.app_handle().clone();
    tauri::async_runtime::spawn(async move {
        let uri_str = request.uri().to_string();
        log::info!("Parsing {:?}", uri_str);

        let content_path = uri_str
            .strip_prefix("shiki://localhost/image/")
            .unwrap();

        let (base_uri, query) = if let Some(pos) = content_path.find('?') {
            (&content_path[..pos], &content_path[pos + 1..])
        } else {
            (content_path, "")
        };

        // Extract query parameters for thumbnail vs full image
        let thumbnail = query.contains("thumbnail=true");

        let image_req_args = ImageLoadRequest {
            uri: base_uri.to_string(),
            thumbnail,
            max_height: None,
            max_width: None,
        };
        let response = app_handle.media().load_image_data(image_req_args);

        log::info!("MediaPlugin Responded {:?}", response);

        let res = match response {
            Ok(result) => {
                log::info!("MediaPlugin IMAGE {:?}", result);
                tauri::http::Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", result.mime_type)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Content-Length", result.data.len().to_string())
                    .body(result.data)
                    .unwrap()
            }
            Err(e) => {
                let body = format!("Error invoking command: {}", e);
                tauri::http::Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(body.as_bytes().to_vec())
                    .unwrap()
            }
        };

        responder.respond(res);
    });
}
