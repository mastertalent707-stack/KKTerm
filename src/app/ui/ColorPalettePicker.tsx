import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HexColorPicker } from "react-colorful";
import "./colorPalettePicker.css";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string | null | undefined): value is `#${string}` {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function ColorPalettePicker({
  value,
  onChange,
  className = "",
}: {
  value?: string | null;
  onChange: (color: `#${string}`) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(isHexColor(value) ? value : "#0a84ff");

  useEffect(() => {
    if (isHexColor(value)) setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectColor = (next: string) => {
    const normalized = next.startsWith("#") ? next : `#${next}`;
    setDraft(normalized);
    if (isHexColor(normalized)) onChange(normalized.toLowerCase() as `#${string}`);
  };

  return (
    <div className={`color-palette-picker ${className}`.trim()} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("common.customColor")}
        className={`color-palette-rainbow${isHexColor(value) ? " selected" : ""}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      />
      {open ? (
        <div
          aria-label={t("common.customColor")}
          className="color-palette-popover"
          role="dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <HexColorPicker color={isHexColor(draft) ? draft : "#0a84ff"} onChange={selectColor} />
          <label className="color-palette-hex-field">
            <span>{t("common.hexColor")}</span>
            <span className="color-palette-hex-input">
              <i style={{ background: isHexColor(draft) ? draft : "transparent" }} />
              <input
                aria-label={t("common.hexColor")}
                maxLength={7}
                onChange={(event) => selectColor(event.currentTarget.value)}
                spellCheck={false}
                value={draft}
              />
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
