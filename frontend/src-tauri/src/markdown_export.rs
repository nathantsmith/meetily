use std::{fs, path::PathBuf, ffi::OsStr};
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

fn sanitize_filename(name: &str) -> String {
    let sanitized: String = name
        .chars()
        .map(|c| if "<>:\"/\\|?*".contains(c) || (c as u32) < 0x20 { '-' } else { c })
        .collect();
    let sanitized = sanitized.trim_matches('-').replace("--", "-");
    if sanitized.is_empty() { "folder".to_string() } else { sanitized }
}

/// Rename a project tag's markdown directory atomically.
#[tauri::command]
pub fn rename_project_tag_dir(dir: String, old_tag: String, new_tag: String) -> Result<(), String> {
    let src = PathBuf::from(&dir).join(sanitize_filename(&old_tag));
    if !src.exists() {
        return Ok(());
    }
    let dst = PathBuf::from(&dir).join(sanitize_filename(&new_tag));
    if dst.exists() {
        // Merge: move each file individually to avoid overwriting the destination dir
        for entry in fs::read_dir(&src).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let dest_file = dst.join(entry.file_name());
            fs::rename(entry.path(), dest_file).map_err(|e| e.to_string())?;
        }
        let _ = fs::remove_dir(&src);
    } else {
        fs::rename(&src, &dst).map_err(|e| format!("Failed to rename folder: {}", e))?;
    }
    Ok(())
}

/// Move all markdown files from a tag directory to the General directory.
#[tauri::command]
pub fn delete_project_tag_dir(dir: String, tag: String) -> Result<(), String> {
    let src = PathBuf::from(&dir).join(sanitize_filename(&tag));
    if !src.exists() {
        return Ok(());
    }
    let general = PathBuf::from(&dir).join("General");
    fs::create_dir_all(&general).map_err(|e| format!("Failed to create General dir: {}", e))?;
    for entry in fs::read_dir(&src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().extension() == Some(OsStr::new("md")) {
            let dest = general.join(entry.file_name());
            fs::rename(entry.path(), dest).map_err(|e| e.to_string())?;
        }
    }
    let _ = fs::remove_dir(&src);
    Ok(())
}
