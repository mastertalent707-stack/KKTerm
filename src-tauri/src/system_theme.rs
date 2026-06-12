use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SystemAccentColor {
    accent: String,
}

#[cfg(target_os = "windows")]
pub(crate) fn system_accent_color() -> Option<SystemAccentColor> {
    use windows::Win32::Graphics::Dwm::DwmGetColorizationColor;

    let mut color = 0u32;
    let mut opaque_blend = windows::Win32::Foundation::BOOL(0);
    unsafe {
        DwmGetColorizationColor(&mut color, &mut opaque_blend).ok()?;
    }

    let red = (color >> 16) & 0xff;
    let green = (color >> 8) & 0xff;
    let blue = color & 0xff;
    Some(SystemAccentColor {
        accent: format!("#{red:02x}{green:02x}{blue:02x}"),
    })
}

#[cfg(not(target_os = "windows"))]
pub(crate) fn system_accent_color() -> Option<SystemAccentColor> {
    None
}
