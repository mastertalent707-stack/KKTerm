//! Restores Win11 rounded window corners after `decorations: false`
//! removed the system frame. The app paints its own title bar via React,
//! but we still want the OS-level corner radius so the window blends with
//! other Win11 apps instead of looking like a rectangular legacy window.

#[cfg(target_os = "windows")]
pub fn apply_main_window_backdrop<R: tauri::Runtime>(window: &tauri::WebviewWindow<R>) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Dwm::{
        DwmSetWindowAttribute, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_ROUND,
    };

    let hwnd = match window.hwnd() {
        Ok(handle) => HWND(handle.0 as *mut _),
        Err(error) => {
            eprintln!("window backdrop: failed to obtain HWND: {error}");
            return;
        }
    };

    let preference: i32 = DWMWCP_ROUND.0;

    unsafe {
        if let Err(error) = DwmSetWindowAttribute(
            hwnd,
            DWMWA_WINDOW_CORNER_PREFERENCE,
            &preference as *const _ as *const _,
            std::mem::size_of::<i32>() as u32,
        ) {
            eprintln!("window backdrop: rounded corners failed: {error}");
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn apply_main_window_backdrop<R: tauri::Runtime>(_window: &tauri::WebviewWindow<R>) {}
