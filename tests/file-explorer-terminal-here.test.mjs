import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Open Terminal Here creates an ephemeral local terminal in the current directory", async () => {
  const storeSource = await readFile(new URL("../src/store.ts", import.meta.url), "utf8");

  assert.match(
    storeSource,
    /openLocalTerminalHere: \(cwd: string, options\?: \{ name\?: string; shell\?: string \}\) => void;/,
    "the workspace store should expose a cwd-aware ephemeral local terminal opener",
  );
  assert.match(
    storeSource,
    /openLocalTerminalHere: \(cwd, options\) => \{[\s\S]*?localStartupDirectory: normalizedCwd,[\s\S]*?type: "local"/,
    "the ephemeral local terminal Connection should carry the requested directory",
  );
});

test("elevated Open Terminal Here forwards the current directory to the Windows launcher", async () => {
  const [storeSource, tauriSource, sessionsSource] = await Promise.all([
    readFile(new URL("../src/store.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/tauri.ts", import.meta.url), "utf8"),
    readFile(new URL("../src-tauri/src/sessions.rs", import.meta.url), "utf8"),
  ]);

  assert.match(storeSource, /openElevatedLocalTerminal: \(option: LocalShellOption, options\?: \{ cwd\?: string \}\) => Promise<void>;/);
  assert.match(storeSource, /request: \{ shell: action\.shell, initialDirectory: options\?\.cwd \}/);
  assert.match(tauriSource, /launch_elevated_terminal:[\s\S]*initialDirectory\?: string/);
  assert.match(sessionsSource, /pub initial_directory: Option<String>/);
  assert.match(sessionsSource, /ShellExecuteW\([\s\S]*directory_ptr/);
});
