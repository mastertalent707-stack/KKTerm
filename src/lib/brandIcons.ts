export const BRAND_ICON_REF_PREFIX = "brand:";
const BRAND_ICON_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;

export type BrandIconEntry = {
  id: string;
  label: string;
  keywords: string[];
};

export const BRAND_ICON_ENTRIES: BrandIconEntry[] = [
  {
    id: "openai-codex",
    label: "OpenAI Codex",
    keywords: ["openai", "codex", "ai", "agent", "coding", "cli"],
  },
  {
    id: "claude-code",
    label: "Claude Code",
    keywords: ["claude", "anthropic", "ai", "agent", "coding", "cli"],
  },
  {
    id: "opencode",
    label: "OpenCode",
    keywords: ["opencode", "ai", "agent", "coding", "cli"],
  },
  {
    id: "cursor",
    label: "Cursor",
    keywords: ["cursor", "ai", "ide", "editor", "coding"],
  },
  {
    id: "github-copilot",
    label: "GitHub Copilot",
    keywords: ["github", "copilot", "ai", "coding", "assistant"],
  },
  {
    id: "windsurf",
    label: "Windsurf",
    keywords: ["windsurf", "codeium", "ai", "ide", "editor", "coding"],
  },
  {
    id: "codeium",
    label: "Codeium",
    keywords: ["codeium", "ai", "coding", "assistant"],
  },
  {
    id: "gemini-cli",
    label: "Gemini CLI",
    keywords: ["gemini", "google", "ai", "agent", "coding", "cli"],
  },
  {
    id: "antigravity",
    label: "Google Antigravity",
    keywords: ["antigravity", "google", "ai", "agent", "coding", "ide"],
  },
  {
    id: "visual-studio-code",
    label: "Visual Studio Code",
    keywords: ["vscode", "vs code", "visual studio code", "editor", "coding"],
  },
  {
    id: "bash",
    label: "GNU Bash",
    keywords: ["bash", "gnu", "shell", "terminal", "linux"],
  },
  {
    id: "zsh",
    label: "Zsh",
    keywords: ["zsh", "z shell", "shell", "terminal", "unix", "macos"],
  },
  {
    id: "fish",
    label: "fish shell",
    keywords: ["fish", "shell", "terminal", "unix", "linux", "macos"],
  },
  {
    id: "powershell",
    label: "PowerShell",
    keywords: ["powershell", "pwsh", "shell", "terminal", "microsoft", "windows"],
  },
  {
    id: "windows-terminal",
    label: "Windows Terminal",
    keywords: ["windows terminal", "terminal", "console", "microsoft", "windows"],
  },
  {
    id: "wsl",
    label: "WSL",
    keywords: ["wsl", "windows subsystem linux", "linux", "shell", "terminal"],
  },
  {
    id: "iterm2",
    label: "iTerm2",
    keywords: ["iterm", "iterm2", "terminal", "macos"],
  },
  {
    id: "wezterm",
    label: "WezTerm",
    keywords: ["wezterm", "terminal", "shell"],
  },
  {
    id: "alacritty",
    label: "Alacritty",
    keywords: ["alacritty", "terminal", "shell"],
  },
  {
    id: "tmux",
    label: "tmux",
    keywords: ["tmux", "terminal", "multiplexer", "shell"],
  },
];

const BRAND_ICON_IDS = new Set(BRAND_ICON_ENTRIES.map((entry) => entry.id));

export function isKnownBrandIconId(id: string): boolean {
  return BRAND_ICON_IDS.has(id);
}

export function brandIconRefForId(id: string): string {
  return `${BRAND_ICON_REF_PREFIX}${id}`;
}

export function brandIconIdFromRef(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !value.startsWith(BRAND_ICON_REF_PREFIX)) {
    return null;
  }
  const id = value.slice(BRAND_ICON_REF_PREFIX.length);
  return BRAND_ICON_ID_PATTERN.test(id) && BRAND_ICON_IDS.has(id) ? id : null;
}

export function isBrandIconRef(value: string | null | undefined): boolean {
  return brandIconIdFromRef(value) !== null;
}
