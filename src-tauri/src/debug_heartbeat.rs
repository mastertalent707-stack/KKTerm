#[cfg(debug_assertions)]
mod debug_impl {
    use std::{
        fs::{self, OpenOptions},
        io::Write,
        path::PathBuf,
        sync::{
            atomic::{AtomicBool, AtomicU64, Ordering},
            OnceLock,
        },
        thread,
        time::{Duration, Instant},
    };

    use crate::logging;

    static STARTED: AtomicBool = AtomicBool::new(false);
    static START: OnceLock<Instant> = OnceLock::new();
    static FRONTEND_HEARTBEAT_MS: AtomicU64 = AtomicU64::new(0);

    pub fn start() {
        if STARTED.swap(true, Ordering::Relaxed) {
            return;
        }

        let start = *START.get_or_init(Instant::now);
        thread::spawn(move || {
            let mut sequence = 0_u64;
            loop {
                sequence = sequence.saturating_add(1);
                write_heartbeat_line(sequence, start);
                thread::sleep(Duration::from_secs(2));
            }
        });
    }

    pub fn record_frontend_heartbeat() {
        let start = *START.get_or_init(Instant::now);
        FRONTEND_HEARTBEAT_MS.store(elapsed_ms(start), Ordering::Relaxed);
    }

    fn write_heartbeat_line(sequence: u64, start: Instant) {
        let runtime_ms = elapsed_ms(start);
        let frontend_ms = FRONTEND_HEARTBEAT_MS.load(Ordering::Relaxed);
        let frontend_age_ms = if frontend_ms == 0 {
            None
        } else {
            Some(runtime_ms.saturating_sub(frontend_ms))
        };
        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap_or_else(|_| time::OffsetDateTime::now_utc().unix_timestamp().to_string());
        let line = match frontend_age_ms {
            Some(age) => format!(
                "{timestamp} debug_heartbeat sequence={sequence} runtimeMs={runtime_ms} frontendAgeMs={age}\n"
            ),
            None => format!(
                "{timestamp} debug_heartbeat sequence={sequence} runtimeMs={runtime_ms} frontendAgeMs=none\n"
            ),
        };
        if let Err(error) = append_line(&line) {
            eprintln!("failed to write debug heartbeat: {error}");
        }
    }

    fn append_line(line: &str) -> std::io::Result<()> {
        let path = heartbeat_log_path().unwrap_or_else(|| PathBuf::from("logs").join("kkterm-heartbeat.debug.log"));
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut file = OpenOptions::new().create(true).append(true).open(path)?;
        file.write_all(line.as_bytes())
    }

    fn heartbeat_log_path() -> Option<PathBuf> {
        Some(
            logging::log_path()?
                .parent()
                .unwrap_or_else(|| std::path::Path::new("."))
                .join("kkterm-heartbeat.debug.log"),
        )
    }

    fn elapsed_ms(start: Instant) -> u64 {
        u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)
    }
}

#[cfg(debug_assertions)]
pub(crate) use debug_impl::{record_frontend_heartbeat, start};

#[cfg(not(debug_assertions))]
pub(crate) fn start() {}

#[cfg(not(debug_assertions))]
pub(crate) fn record_frontend_heartbeat() {}
