#!/usr/bin/env zsh
set -euo pipefail

KEY_PATH=${TAURI_SIGNING_PRIVATE_KEY_PATH:-$HOME/.tauri/kkterm-updater.key}

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]]; then
  if [[ ! -f "$KEY_PATH" ]]; then
    print -u2 "Missing Tauri updater signing key: $KEY_PATH"
    print -u2 "Set TAURI_SIGNING_PRIVATE_KEY or TAURI_SIGNING_PRIVATE_KEY_PATH before running npm run package:macos."
    exit 1
  fi

  export TAURI_SIGNING_PRIVATE_KEY="$(<"$KEY_PATH")"
fi

export TAURI_SIGNING_PRIVATE_KEY_PATH="$KEY_PATH"

npm exec tauri -- build --target aarch64-apple-darwin --bundles app,dmg "$@"
