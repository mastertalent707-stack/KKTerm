import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const fileViewerWorkspace = await readFile(
  new URL("../src/modules/workspace/connections/file-viewer/FileViewerWorkspace.tsx", import.meta.url),
  "utf8",
);
const imageViewer = await readFile(
  new URL("../src/modules/workspace/connections/file-viewer/viewers/ImageViewer.tsx", import.meta.url),
  "utf8",
);
const pdfViewer = await readFile(
  new URL("../src/modules/workspace/connections/file-viewer/viewers/PdfViewer.tsx", import.meta.url),
  "utf8",
);
const backgroundLayer = await readFile(
  new URL("../src/modules/workspace/connections/file-viewer/FileViewerBackgroundLayer.tsx", import.meta.url),
  "utf8",
);
const fileViewerCss = await readFile(
  new URL("../src/modules/workspace/connections/file-viewer/file-viewer.css", import.meta.url),
  "utf8",
);
const manual = await readFile(
  new URL("../docs/manual/03-connections.md", import.meta.url),
  "utf8",
);

test("image and PDF Document viewers expose the shared background picker from a hamburger menu", () => {
  assert.match(fileViewerWorkspace, /showBackgroundMenu\s*=\s*activeKind === "image" \|\| activeKind === "pdf"/);
  assert.match(fileViewerWorkspace, /workspace\.fileViewer\.viewOptions/);
  assert.match(fileViewerWorkspace, /workspace\.fileViewer\.background/);
  assert.match(fileViewerWorkspace, /<FileViewerBackgroundPopover/);
  assert.match(backgroundLayer, /titleKey="dashboard\.changeBackground"/);
  assert.match(backgroundLayer, /defaultHintKey="workspace\.fileViewer\.backgroundDefaultHint"/);
});

test("Document viewer backgrounds persist on the durable Connection", () => {
  assert.match(fileViewerWorkspace, /updateOpenConnectionTerminalAppearance/);
  assert.match(fileViewerWorkspace, /update_connection_terminal_appearance/);
  assert.match(fileViewerWorkspace, /terminalBackground:\s*nextBackground/);
});

test("image and PDF stages render a file-viewer background layer behind the document", () => {
  assert.match(imageViewer, /<FileViewerBackgroundLayer\s+active=\{active\}\s+background=\{background\}/);
  assert.match(pdfViewer, /<FileViewerBackgroundLayer\s+active=\{active\}\s+background=\{background\}/);
  assert.match(backgroundLayer, /SharedBackgroundPopover/);
  assert.doesNotMatch(backgroundLayer, /BACKGROUND_PRESETS\.map/);
  assert.doesNotMatch(backgroundLayer, /DYNAMIC_BACKGROUNDS\.map/);
  assert.match(fileViewerCss, /\.fv-bg-layer\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(fileViewerCss, /\.fv-img\s*\{[\s\S]*z-index:\s*1;/);
});

test("manual documents Document viewer background scope and persistence", () => {
  assert.match(manual, /workspace\.fileViewer\.viewOptions/);
  assert.match(manual, /workspace\.fileViewer\.background/);
  assert.match(manual, /persists per Document Connection/i);
});
