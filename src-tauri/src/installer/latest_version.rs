// Per-provider "what's the latest available version of this tool" queries.
// Manual or opt-in-daily; never auto-installs.

use std::process::Command;

use super::proc::no_window;
use super::schema::{Catalog, Provider, Recipe};

pub fn latest_version(recipe: &Recipe) -> Option<String> {
    match &recipe.provider {
        Provider::Winget { id } => winget_latest(id),
        Provider::Npm { pkg } => npm_latest(pkg),
        Provider::GithubRelease { repo, .. } => github_latest(repo),
        Provider::WindowsFeature { .. } => None,
        Provider::Bundle { .. } => None,
    }
}

pub fn latest_version_in_catalog(recipe: &Recipe, catalog: &Catalog) -> Option<String> {
    if let Provider::Bundle { steps } = &recipe.provider {
        if steps.len() == 1 {
            let child = catalog.recipes.iter().find(|r| r.id == steps[0])?;
            return latest_version(child);
        }
        return None;
    }
    latest_version(recipe)
}

fn winget_latest(id: &str) -> Option<String> {
    let output = no_window(&mut Command::new("winget"))
        .args([
            "show",
            "--id",
            id,
            "--exact",
            "--source",
            "winget",
            "--disable-interactivity",
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("Version:") {
            let v = rest.trim();
            if !v.is_empty() {
                return Some(v.to_string());
            }
        }
    }
    None
}

fn npm_latest(pkg: &str) -> Option<String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent("KKTerm-Installer/1")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .ok()?;
    let body = client
        .get(npm_registry_url(pkg))
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.text())
        .ok()?;
    npm_latest_from_registry_document(&body)
}

fn npm_latest_from_registry_document(json: &str) -> Option<String> {
    let json: serde_json::Value = serde_json::from_str(json).ok()?;
    json.get("dist-tags")
        .and_then(|tags| tags.get("latest"))
        .and_then(|v| v.as_str())
        .filter(|v| !v.trim().is_empty())
        .map(|s| s.to_string())
}

fn npm_registry_url(pkg: &str) -> String {
    format!("https://registry.npmjs.org/{}", encode_npm_package_name(pkg))
}

fn encode_npm_package_name(pkg: &str) -> String {
    let mut encoded = String::with_capacity(pkg.len());
    for byte in pkg.bytes() {
        match byte {
            b'A'..=b'Z'
            | b'a'..=b'z'
            | b'0'..=b'9'
            | b'-'
            | b'_'
            | b'.'
            | b'~'
            | b'@' => encoded.push(byte as char),
            _ => {
                encoded.push('%');
                encoded.push_str(&format!("{byte:02X}"));
            }
        }
    }
    encoded
}

fn github_latest(repo: &str) -> Option<String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent("KKTerm-Installer/1")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .ok()?;
    let url = format!("https://api.github.com/repos/{repo}/releases/latest");
    let json: serde_json::Value = client
        .get(&url)
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.json())
        .ok()?;
    json.get("tag_name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn npm_registry_document_returns_dist_tag_latest() {
        let json = r#"{
            "name": "@openai/codex",
            "dist-tags": {
                "latest": "0.42.0",
                "beta": "0.43.0-beta.1"
            }
        }"#;

        assert_eq!(
            npm_latest_from_registry_document(json),
            Some("0.42.0".to_string())
        );
    }

    #[test]
    fn npm_registry_document_without_latest_is_unknown() {
        let json = r#"{
            "name": "example",
            "dist-tags": {
                "beta": "1.0.0-beta.1"
            }
        }"#;

        assert_eq!(npm_latest_from_registry_document(json), None);
    }

    #[test]
    fn npm_registry_url_percent_encodes_scoped_package_slash() {
        assert_eq!(
            npm_registry_url("@anthropic-ai/claude-code"),
            "https://registry.npmjs.org/@anthropic-ai%2Fclaude-code"
        );
    }
}
