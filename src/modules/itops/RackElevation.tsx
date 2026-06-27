// Read-only rack front elevation (docs/FLEET.md Phase C). Renders one Rack as a
// fixed-height column of U slots with its items placed at their U positions.
// Drag-to-place, click-to-connect, and editing arrive in later Phase C slices;
// this slice only visualizes the stored topology.

import { useTranslation } from "react-i18next";
import type { Rack, RackItem, RackItemKind } from "../../types";
import { ItIcon, type ItIconName } from "./icons";

// Pixel height of one rack unit (U) row. Kept in sync with `--rk-u` in CSS.
const U_PX = 22;

const KIND_ICON: Record<RackItemKind, ItIconName | null> = {
  connection: "server",
  server: "server",
  switch: "link",
  pdu: "power",
  patchPanel: "link",
  blank: null,
  label: null,
};

// Grid row for the top edge of an item: rows run top-down (row 1 = highest U),
// so an item's top U maps to `heightU - topU + 1`.
function itemRowStart(rackHeightU: number, item: RackItem): number {
  const topU = item.startU + item.heightU - 1;
  return rackHeightU - topU + 1;
}

export function RackElevation({ rack }: { rack: Rack }) {
  const { t } = useTranslation();
  // Top-to-bottom U numbers: heightU … 1.
  const unitNumbers = Array.from({ length: rack.heightU }, (_, i) => rack.heightU - i);

  return (
    <div className="rk">
      <div className="rk-head">
        <span className="rk-name">{rack.name}</span>
        <span className="rk-meta">
          {t("itops.racks.unitCount", { count: rack.heightU })}
          {rack.items.length > 0
            ? `  ·  ${t("itops.racks.deviceCount", { count: rack.items.length })}`
            : ""}
        </span>
      </div>
      <div
        className="rk-grid"
        style={{ gridTemplateRows: `repeat(${rack.heightU}, var(--rk-u, ${U_PX}px))` }}
      >
        {/* U-number gutter + empty slots, one row per U. */}
        {unitNumbers.map((u) => (
          <div className="rk-u" key={`u-${u}`} style={{ gridRow: rack.heightU - u + 1 }}>
            {u}
          </div>
        ))}
        {unitNumbers.map((u) => (
          <div className="rk-slot" key={`s-${u}`} style={{ gridColumn: 2, gridRow: rack.heightU - u + 1 }} />
        ))}
        {/* Items paint over the empty slots they occupy. */}
        {rack.items.map((item) => {
          const icon = KIND_ICON[item.kind];
          return (
            <div
              key={item.id}
              className={`rk-item kind-${item.kind}`}
              style={{
                gridColumn: 2,
                gridRow: `${itemRowStart(rack.heightU, item)} / span ${item.heightU}`,
              }}
              title={item.label || t(`itops.racks.kind.${item.kind}`)}
            >
              {icon ? (
                <span className="rk-item-ic">
                  <ItIcon name={icon} size={13} sw={1.6} />
                </span>
              ) : null}
              <span className="rk-item-label">
                {item.label || t(`itops.racks.kind.${item.kind}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
