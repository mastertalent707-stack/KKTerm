import { defaultSshSettings, defaultTerminalSettings } from "../../../app-defaults";
import { resolveDefaultTerminalAppearance } from "./terminalAppearanceDefaults.ts";
import { DYNAMIC_BACKGROUNDS } from "../../dashboard/registry/dynamicBackgrounds";

const sshAppearance = resolveDefaultTerminalAppearance(
  "ssh",
  {
    ...defaultSshSettings,
    defaultTransparency: 65,
    useRandomDynamicBackground: true,
  },
  {
    ...defaultTerminalSettings,
    defaultTransparency: 20,
    useRandomDynamicBackground: false,
  },
  () => 0,
);

if (sshAppearance.terminalOpacity !== 35) {
  throw new Error("SSH default transparency should resolve through SSH settings.");
}

if (sshAppearance.terminalBackground?.kind !== "dynamic" || sshAppearance.terminalBackground.dynamic !== DYNAMIC_BACKGROUNDS[0]?.id) {
  throw new Error("SSH random dynamic background should resolve through SSH settings.");
}

const localAppearance = resolveDefaultTerminalAppearance(
  "local",
  {
    ...defaultSshSettings,
    defaultTransparency: 65,
    useRandomDynamicBackground: true,
  },
  {
    ...defaultTerminalSettings,
    defaultTransparency: 20,
    useRandomDynamicBackground: false,
  },
  () => 0,
);

if (localAppearance.terminalOpacity !== 80) {
  throw new Error("Local terminal default transparency should resolve through Terminal settings.");
}

if (localAppearance.terminalBackground !== null) {
  throw new Error("Terminal random dynamic background should stay empty when disabled.");
}
