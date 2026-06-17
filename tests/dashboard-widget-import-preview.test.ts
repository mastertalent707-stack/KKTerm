import assert from "node:assert/strict";
import test from "node:test";
import { parseWidgetImportPreview } from "../src/modules/dashboard/edit/widgetImportPreview.ts";

const validWidgetFile = {
  product: "KKTerm",
  format: "kkterm-widgets",
  version: 1,
  widgets: [
    {
      title: "Latency Board",
      summary: "Tracks host latency.",
      category: "Network",
      bodyJson: JSON.stringify({
        source: "document.getElementById('root').textContent = 'ok';",
        permissions: { network: false },
        htmlShim: "<div id=\"root\"></div>",
      }),
      settingsSchemaJson: JSON.stringify({ fields: [] }),
    },
  ],
};

test("previews valid widget import JSON", () => {
  const preview = parseWidgetImportPreview(JSON.stringify(validWidgetFile));

  assert.equal(preview.ok, true);
  if (!preview.ok) return;
  assert.equal(preview.count, 1);
  assert.deepEqual(preview.titles, ["Latency Board"]);
});

test("rejects malformed widget import JSON", () => {
  const preview = parseWidgetImportPreview("{not json");

  assert.equal(preview.ok, false);
  if (preview.ok) return;
  assert.match(preview.reason, /JSON/i);
});

test("rejects widget import JSON with an invalid body", () => {
  const preview = parseWidgetImportPreview(JSON.stringify({
    ...validWidgetFile,
    widgets: [{ ...validWidgetFile.widgets[0], bodyJson: "{}" }],
  }));

  assert.equal(preview.ok, false);
  if (preview.ok) return;
  assert.match(preview.reason, /body/i);
});
