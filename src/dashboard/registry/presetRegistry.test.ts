import { WIDGET_PRESETS, type WidgetPreset } from "../types";
import { PRESET_RENDERERS } from "./presetRegistry";

if (WIDGET_PRESETS.includes("mono" as WidgetPreset)) {
  throw new Error("Mono should not be offered as a Dashboard widget preset.");
}

for (const preset of WIDGET_PRESETS) {
  if (!PRESET_RENDERERS[preset]) {
    throw new Error(`Dashboard preset renderer missing for ${preset}.`);
  }
}
