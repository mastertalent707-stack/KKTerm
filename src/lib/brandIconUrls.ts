import { brandIconIdFromRef, isKnownBrandIconId } from "./brandIcons";
import anthropicIcon from "../assets/installer-icons/anthropic.svg?url";
import antigravityIcon from "../assets/installer-icons/antigravity.svg?url";
import cursorIcon from "../assets/installer-icons/cursor.svg?url";
import geminiIcon from "../assets/installer-icons/gemini.svg?url";
import linuxIcon from "../assets/installer-icons/linux.svg?url";
import openaiIcon from "../assets/installer-icons/openai.svg?url";
import opencodeIcon from "../assets/installer-icons/opencode.svg?url";
import powershellIcon from "../assets/installer-icons/powershell.svg?url";
import alacrittyIcon from "../assets/connection-icons/tools/alacritty.svg?url";
import bashIcon from "../assets/connection-icons/tools/gnubash.svg?url";
import codeiumIcon from "../assets/connection-icons/tools/codeium.svg?url";
import fishIcon from "../assets/connection-icons/tools/fishshell.svg?url";
import githubCopilotIcon from "../assets/connection-icons/tools/githubcopilot.svg?url";
import iterm2Icon from "../assets/connection-icons/tools/iterm2.svg?url";
import tmuxIcon from "../assets/connection-icons/tools/tmux.svg?url";
import visualStudioCodeIcon from "../assets/connection-icons/tools/visualstudiocode.svg?url";
import weztermIcon from "../assets/connection-icons/tools/wezterm.svg?url";
import windsurfIcon from "../assets/connection-icons/tools/windsurf.svg?url";
import windowsTerminalIcon from "../assets/connection-icons/tools/windowsterminal.svg?url";
import zshIcon from "../assets/connection-icons/tools/zsh.svg?url";

const brandIconUrlById: Record<string, string> = {
  "openai-codex": openaiIcon,
  "claude-code": anthropicIcon,
  opencode: opencodeIcon,
  cursor: cursorIcon,
  "github-copilot": githubCopilotIcon,
  windsurf: windsurfIcon,
  codeium: codeiumIcon,
  "gemini-cli": geminiIcon,
  antigravity: antigravityIcon,
  "visual-studio-code": visualStudioCodeIcon,
  bash: bashIcon,
  zsh: zshIcon,
  fish: fishIcon,
  powershell: powershellIcon,
  "windows-terminal": windowsTerminalIcon,
  wsl: linuxIcon,
  iterm2: iterm2Icon,
  wezterm: weztermIcon,
  alacritty: alacrittyIcon,
  tmux: tmuxIcon,
};

export function brandIconUrlForId(id: string): string | null {
  return isKnownBrandIconId(id) ? brandIconUrlById[id] ?? null : null;
}

export function brandIconRefToUrl(value: string | null | undefined): string | null {
  const id = brandIconIdFromRef(value);
  return id ? brandIconUrlForId(id) : null;
}
