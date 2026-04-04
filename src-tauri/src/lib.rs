use tauri::Manager;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::process::restart;
use tauri_plugin_updater::UpdaterExt;

const CHATGPT_URL: &str =
    "https://chatgpt.com/g/g-69af0fb012108191a5078db17bb26419-fcos-master-agent-builder";

// ── Shared state ──────────────────────────────────────────────────────────────

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct ChatWindowMeta {
    id:     String,
    title:  String,
    colour: String,
}

struct AppState {
    chat_windows: HashMap<String, ChatWindowMeta>,
}

// ── Phase 12B — single ChatGPT window shortcut ────────────────────────────────

#[tauri::command]
fn open_chatgpt_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("chatgpt") {
        let _ = win.set_focus();
        return Ok(());
    }
    tauri::WebviewWindowBuilder::new(
        &app,
        "chatgpt",
        tauri::WebviewUrl::External(CHATGPT_URL.parse().unwrap()),
    )
    .title("FCOS Symbiote — ChatGPT")
    .inner_size(480.0, 700.0)
    .position(820.0, 80.0)
    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    .build()
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Phase 12C — multi-chat workspace commands ─────────────────────────────────

#[tauri::command]
fn open_chat_window(
    app:    tauri::AppHandle,
    state:  tauri::State<'_, Mutex<AppState>>,
    id:     String,
    title:  String,
    colour: String,
    url:    String,
    x:      f64,
    y:      f64,
    width:  f64,
    height: f64,
) -> Result<(), String> {
    // Re-focus if already open
    if let Some(win) = app.get_webview_window(&id) {
        let _ = win.set_focus();
        return Ok(());
    }

    let parsed_url: url::Url = url.parse().map_err(|e: url::ParseError| e.to_string())?;
    tauri::WebviewWindowBuilder::new(&app, &id, tauri::WebviewUrl::External(parsed_url))
        .title(&title)
        .inner_size(width, height)
        .position(x, y)
        .min_inner_size(300.0, 400.0)
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let mut st = state.lock().map_err(|e| e.to_string())?;
    st.chat_windows.insert(id.clone(), ChatWindowMeta { id, title, colour });
    Ok(())
}

#[tauri::command]
fn list_chat_windows(state: tauri::State<'_, Mutex<AppState>>) -> Vec<ChatWindowMeta> {
    state
        .lock()
        .map(|st| st.chat_windows.values().cloned().collect())
        .unwrap_or_default()
}

#[tauri::command]
fn close_chat_window(
    app:   tauri::AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id:    String,
) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&id) {
        win.close().map_err(|e| e.to_string())?;
    }
    if let Ok(mut st) = state.lock() {
        st.chat_windows.remove(&id);
    }
    Ok(())
}

#[tauri::command]
fn focus_chat_window(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&id) {
        let _ = win.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ── Auto-updater command ───────────────────────────────────────────────────────

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<String, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await {
        Ok(Some(update)) => {
            let version = update.version.clone();
            // Download and install in background
            tauri::async_runtime::spawn(async move {
                let _ = update.download_and_install(|_, _| {}, || {}).await;
                // Restart after install
                restart(&app.env());
            });
            Ok(format!("Updating to v{}…", version))
        }
        Ok(None) => Ok("You're on the latest version.".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState {
            chat_windows: HashMap::new(),
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            open_chatgpt_window,
            open_chat_window,
            list_chat_windows,
            close_chat_window,
            focus_chat_window,
            check_for_updates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
