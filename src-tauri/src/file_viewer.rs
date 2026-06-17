//! Backend file-reading primitives for the File Viewer Connection (kind
//! `fileView`). These are pure, blocking filesystem helpers; every Tauri
//! command that calls them must do so from a background worker
//! (`run_blocking_command`/`spawn_blocking`) per the UI-liveness invariant —
//! filesystem reads must never run on the foreground command runtime.
//!
//! The viewer reads local files in three shapes: a cheap metadata/type probe,
//! a bounded UTF-8 text read (head or tail) for text/code/log/structured-data
//! viewers, and a bounded base64 byte read for image/binary/hex viewers. All
//! reads are explicitly capped so a multi-gigabyte file cannot exhaust memory.

use base64::Engine;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use std::time::UNIX_EPOCH;

/// Number of leading bytes sampled for the text/binary heuristic and magic-byte
/// signature detection.
const PROBE_SAMPLE_BYTES: usize = 8192;

/// Hard upper bound on a single text or byte read regardless of the requested
/// size, so a viewer bug or hostile request cannot allocate unbounded memory.
const READ_HARD_CAP_BYTES: u64 = 64 * 1024 * 1024;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileViewProbeRequest {
    pub path: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileViewTextRequest {
    pub path: String,
    /// Maximum number of bytes to read; clamped to `READ_HARD_CAP_BYTES`.
    pub max_bytes: u64,
    /// When true, read the trailing `max_bytes` of the file (used by the log
    /// viewer's follow/tail mode) instead of the leading bytes.
    #[serde(default)]
    pub from_end: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileViewBytesRequest {
    pub path: String,
    pub offset: u64,
    pub length: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileViewProbe {
    pub total_size: u64,
    pub mtime_ms: i64,
    /// Heuristic: the sampled prefix contains no NUL byte and decodes as UTF-8.
    pub is_text: bool,
    /// Detected container/image signature (`png`, `jpeg`, `gif`, `webp`, `bmp`,
    /// `pdf`, `zip`, `gzip`, `sqlite`) when one matches, else `None`.
    pub magic: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileViewText {
    pub text: String,
    pub total_size: u64,
    pub bytes_read: u64,
    /// True when the file is larger than what was returned.
    pub truncated: bool,
    /// True when this is the trailing slice of the file (`from_end`).
    pub from_end: bool,
    pub mtime_ms: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileViewBytes {
    pub base64: String,
    pub total_size: u64,
    pub offset: u64,
    pub bytes_read: u64,
    pub eof: bool,
    pub mtime_ms: i64,
}

fn metadata_for(path: &Path) -> Result<std::fs::Metadata, String> {
    let metadata = std::fs::metadata(path).map_err(|error| format!("cannot read file: {error}"))?;
    if metadata.is_dir() {
        return Err("path is a directory, not a file".to_string());
    }
    Ok(metadata)
}

fn mtime_ms(metadata: &std::fs::Metadata) -> i64 {
    metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|delta| delta.as_millis() as i64)
        .unwrap_or(0)
}

fn detect_magic(sample: &[u8]) -> Option<String> {
    let starts = |prefix: &[u8]| sample.len() >= prefix.len() && &sample[..prefix.len()] == prefix;
    if starts(b"\x89PNG\r\n\x1a\n") {
        return Some("png".to_string());
    }
    if starts(&[0xFF, 0xD8, 0xFF]) {
        return Some("jpeg".to_string());
    }
    if starts(b"GIF87a") || starts(b"GIF89a") {
        return Some("gif".to_string());
    }
    if starts(b"RIFF") && sample.len() >= 12 && &sample[8..12] == b"WEBP" {
        return Some("webp".to_string());
    }
    if starts(b"BM") {
        return Some("bmp".to_string());
    }
    if starts(b"%PDF-") {
        return Some("pdf".to_string());
    }
    if starts(&[0x50, 0x4B, 0x03, 0x04]) || starts(&[0x50, 0x4B, 0x05, 0x06]) {
        return Some("zip".to_string());
    }
    if starts(&[0x1F, 0x8B]) {
        return Some("gzip".to_string());
    }
    if starts(b"SQLite format 3\0") {
        return Some("sqlite".to_string());
    }
    None
}

/// Cheap text/binary heuristic over a sampled prefix: a NUL byte is a strong
/// binary signal, and the remaining bytes must decode as UTF-8 (allowing a
/// truncated multi-byte sequence at the very end of the sample).
fn looks_like_text(sample: &[u8]) -> bool {
    if sample.contains(&0) {
        return false;
    }
    match std::str::from_utf8(sample) {
        Ok(_) => true,
        Err(error) => {
            // Accept a multi-byte char clipped by the sample boundary, but a
            // genuine decode error earlier in the buffer means binary.
            error.error_len().is_none() && error.valid_up_to() + 4 >= sample.len()
        }
    }
}

pub fn probe(request: FileViewProbeRequest) -> Result<FileViewProbe, String> {
    let path = Path::new(&request.path);
    let metadata = metadata_for(path)?;
    let total_size = metadata.len();

    let mut file = File::open(path).map_err(|error| format!("cannot open file: {error}"))?;
    let mut sample = vec![0u8; PROBE_SAMPLE_BYTES.min(total_size as usize)];
    let read = file
        .read(&mut sample)
        .map_err(|error| format!("cannot read file: {error}"))?;
    sample.truncate(read);

    Ok(FileViewProbe {
        total_size,
        mtime_ms: mtime_ms(&metadata),
        is_text: looks_like_text(&sample),
        magic: detect_magic(&sample),
    })
}

pub fn read_text(request: FileViewTextRequest) -> Result<FileViewText, String> {
    let path = Path::new(&request.path);
    let metadata = metadata_for(path)?;
    let total_size = metadata.len();
    let cap = request.max_bytes.min(READ_HARD_CAP_BYTES);

    let mut file = File::open(path).map_err(|error| format!("cannot open file: {error}"))?;
    let start = if request.from_end {
        total_size.saturating_sub(cap)
    } else {
        0
    };
    if start > 0 {
        file.seek(SeekFrom::Start(start))
            .map_err(|error| format!("cannot seek file: {error}"))?;
    }

    let to_read = cap.min(total_size.saturating_sub(start)) as usize;
    let mut buffer = vec![0u8; to_read];
    let mut filled = 0usize;
    while filled < to_read {
        let read = file
            .read(&mut buffer[filled..])
            .map_err(|error| format!("cannot read file: {error}"))?;
        if read == 0 {
            break;
        }
        filled += read;
    }
    buffer.truncate(filled);

    let text = String::from_utf8_lossy(&buffer).into_owned();
    let bytes_read = filled as u64;
    Ok(FileViewText {
        text,
        total_size,
        bytes_read,
        truncated: start > 0 || bytes_read < total_size,
        from_end: request.from_end,
        mtime_ms: mtime_ms(&metadata),
    })
}

pub fn read_bytes(request: FileViewBytesRequest) -> Result<FileViewBytes, String> {
    let path = Path::new(&request.path);
    let metadata = metadata_for(path)?;
    let total_size = metadata.len();
    let offset = request.offset.min(total_size);
    let length = request.length.min(READ_HARD_CAP_BYTES);

    let mut file = File::open(path).map_err(|error| format!("cannot open file: {error}"))?;
    if offset > 0 {
        file.seek(SeekFrom::Start(offset))
            .map_err(|error| format!("cannot seek file: {error}"))?;
    }

    let to_read = length.min(total_size.saturating_sub(offset)) as usize;
    let mut buffer = vec![0u8; to_read];
    let mut filled = 0usize;
    while filled < to_read {
        let read = file
            .read(&mut buffer[filled..])
            .map_err(|error| format!("cannot read file: {error}"))?;
        if read == 0 {
            break;
        }
        filled += read;
    }
    buffer.truncate(filled);

    let bytes_read = filled as u64;
    Ok(FileViewBytes {
        base64: base64::engine::general_purpose::STANDARD.encode(&buffer),
        total_size,
        offset,
        bytes_read,
        eof: offset + bytes_read >= total_size,
        mtime_ms: mtime_ms(&metadata),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn temp_file(name: &str, bytes: &[u8]) -> std::path::PathBuf {
        let mut path = std::env::temp_dir();
        path.push(format!("kkterm-fileview-{}-{name}", std::process::id()));
        let mut file = File::create(&path).unwrap();
        file.write_all(bytes).unwrap();
        path
    }

    #[test]
    fn probe_detects_text_and_size() {
        let path = temp_file("text.txt", b"hello\nworld\n");
        let probe = probe(FileViewProbeRequest {
            path: path.to_string_lossy().into_owned(),
        })
        .unwrap();
        assert_eq!(probe.total_size, 12);
        assert!(probe.is_text);
        assert_eq!(probe.magic, None);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn probe_detects_png_magic_and_binary() {
        let mut bytes = b"\x89PNG\r\n\x1a\n".to_vec();
        bytes.extend_from_slice(&[0, 1, 2, 3]);
        let path = temp_file("img.png", &bytes);
        let probe = probe(FileViewProbeRequest {
            path: path.to_string_lossy().into_owned(),
        })
        .unwrap();
        assert_eq!(probe.magic.as_deref(), Some("png"));
        assert!(!probe.is_text);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn read_text_truncates_and_tails() {
        let path = temp_file("big.log", b"0123456789");
        let head = read_text(FileViewTextRequest {
            path: path.to_string_lossy().into_owned(),
            max_bytes: 4,
            from_end: false,
        })
        .unwrap();
        assert_eq!(head.text, "0123");
        assert!(head.truncated);

        let tail = read_text(FileViewTextRequest {
            path: path.to_string_lossy().into_owned(),
            max_bytes: 4,
            from_end: true,
        })
        .unwrap();
        assert_eq!(tail.text, "6789");
        assert!(tail.from_end);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn read_bytes_chunks_with_offset() {
        let path = temp_file("bin.dat", b"ABCDEFGH");
        let chunk = read_bytes(FileViewBytesRequest {
            path: path.to_string_lossy().into_owned(),
            offset: 2,
            length: 3,
        })
        .unwrap();
        let decoded = base64::engine::general_purpose::STANDARD
            .decode(chunk.base64)
            .unwrap();
        assert_eq!(decoded, b"CDE");
        assert_eq!(chunk.offset, 2);
        assert!(!chunk.eof);
        std::fs::remove_file(path).ok();
    }
}
