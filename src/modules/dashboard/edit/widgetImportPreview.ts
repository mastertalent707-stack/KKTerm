import {
  validateCustomWidgetBodyJson,
  validateWidgetSettingsSchemaJson,
} from "../schema";

const WIDGET_EXPORT_FORMAT = "kkterm-widgets";
const WIDGET_EXPORT_VERSION = 1;

interface WidgetImportEntry {
  title: string;
  summary: string;
  category: string;
  bodyJson: string;
  settingsSchemaJson: string;
}

export type WidgetImportPreview =
  | { ok: true; count: number; titles: string[]; widgets: WidgetImportEntry[] }
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string | { error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: `Widget ${field} must be a non-empty string.` };
  }
  return value;
}

export function parseWidgetImportPreview(rawJson: string): WidgetImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    return {
      ok: false,
      reason: `Widget JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!isRecord(parsed) || parsed.format !== WIDGET_EXPORT_FORMAT) {
    return { ok: false, reason: "Widget JSON is not a KKTerm widget export." };
  }
  if (typeof parsed.version !== "number" || parsed.version > WIDGET_EXPORT_VERSION) {
    return { ok: false, reason: "Widget JSON uses an unsupported export version." };
  }
  if (!Array.isArray(parsed.widgets) || parsed.widgets.length === 0) {
    return { ok: false, reason: "Widget JSON does not contain any widgets." };
  }

  const widgets: WidgetImportEntry[] = [];
  for (const [index, value] of parsed.widgets.entries()) {
    if (!isRecord(value)) {
      return { ok: false, reason: `Widget ${index + 1} is not a valid object.` };
    }

    const title = requiredString(value.title, "title");
    if (typeof title !== "string") return { ok: false, reason: title.error };
    const summary = requiredString(value.summary, "summary");
    if (typeof summary !== "string") return { ok: false, reason: summary.error };
    const category = requiredString(value.category, "category");
    if (typeof category !== "string") return { ok: false, reason: category.error };
    const bodyJson = requiredString(value.bodyJson, "body JSON");
    if (typeof bodyJson !== "string") return { ok: false, reason: bodyJson.error };
    const settingsSchemaJson = requiredString(value.settingsSchemaJson, "settings schema JSON");
    if (typeof settingsSchemaJson !== "string") return { ok: false, reason: settingsSchemaJson.error };

    const body = validateCustomWidgetBodyJson(bodyJson);
    if (!body.ok) {
      return { ok: false, reason: `Widget "${title}" body is invalid: ${body.reason}` };
    }
    const settingsSchema = validateWidgetSettingsSchemaJson(settingsSchemaJson);
    if (!settingsSchema.ok) {
      return { ok: false, reason: `Widget "${title}" settings schema is invalid: ${settingsSchema.reason}` };
    }
    widgets.push({ title, summary, category, bodyJson, settingsSchemaJson });
  }

  return {
    ok: true,
    count: widgets.length,
    titles: widgets.map((widget) => widget.title),
    widgets,
  };
}
