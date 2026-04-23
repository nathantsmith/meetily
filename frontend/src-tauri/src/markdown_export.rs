use std::{fs, path::PathBuf};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn pick_markdown_output_dir(app: AppHandle) -> Result<Option<String>, String> {
    let file_path = app
        .dialog()
        .file()
        .set_title("Select Markdown Notes Directory")
        .blocking_pick_folder();

    Ok(file_path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn write_meeting_markdown(path: String, content: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    fs::write(&file_path, content.as_bytes())
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn move_meeting_markdown(old_path: String, new_path: String) -> Result<(), String> {
    let src = PathBuf::from(&old_path);
    if !src.exists() {
        return Ok(()); // Nothing to move
    }
    let dst = PathBuf::from(&new_path);
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    fs::rename(&src, &dst).map_err(|e| format!("Failed to move file: {}", e))
}
