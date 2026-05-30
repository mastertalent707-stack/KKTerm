import fs from "node:fs";
import path from "node:path";

const dialogPath = path.join(
  process.cwd(),
  "src",
  "modules",
  "installer",
  "InstallerToolDialog.tsx",
);
const source = fs.readFileSync(dialogPath, "utf8");

const fallbackStart = source.indexOf("if (!hasPlan) {");
const fallbackEnd = source.indexOf("const active = stepper!.activeStepId;", fallbackStart);

if (fallbackStart === -1 || fallbackEnd === -1) {
  throw new Error("Could not locate the legacy stepper fallback block.");
}

const fallback = source.slice(fallbackStart, fallbackEnd);
if (fallback.includes("stepper?.logs[GENERAL_STEP_BUCKET]")) {
  throw new Error(
    "Legacy stepper fallback must not render both inFlight.log and the general stepper log bucket.",
  );
}
