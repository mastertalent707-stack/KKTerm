import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState, type CSSProperties, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { isTauriRuntime, openExternalUrl } from "../../../../lib/tauri";
import { BACKGROUND_PRESETS, resolveBackgroundPreset } from "../../../dashboard/registry/backgroundPresets";
import { DYNAMIC_BACKGROUNDS, DashboardDynamicBackground } from "../../../dashboard/registry/dynamicBackgrounds";
import { BACKGROUND_FITS, type BackgroundFit, type DashboardBackground } from "../../../dashboard/types";
import { importBackgroundImage, loadBackgroundImage } from "../../../dashboard/state/persistence";

type Mode = "default" | "preset" | "media" | "dynamic";

type MediaBackground = Extract<DashboardBackground, { kind: "image" | "video" }>;

function modeOf(background: DashboardBackground | null): Mode {
  if (!background) return "default";
  if (background.kind === "preset") return "preset";
  if (background.kind === "dynamic") return "dynamic";
  return "media";
}

function isMediaBackground(background: DashboardBackground | null): background is MediaBackground {
  return background?.kind === "image" || background?.kind === "video";
}

function mediaKindForFile(file: string): "image" | "video" {
  return /\.(mp4|webm|mov|m4v|ogv)$/i.test(file) ? "video" : "image";
}

function backgroundFitStyle(fit: BackgroundFit): CSSProperties {
  switch (fit) {
    case "fill":    return { backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" };
    case "fit":     return { backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" };
    case "stretch": return { backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" };
    case "tile":    return { backgroundSize: "auto", backgroundRepeat: "repeat" };
    case "center":  return { backgroundSize: "auto", backgroundRepeat: "no-repeat", backgroundPosition: "center" };
  }
}

function videoFitStyle(fit: BackgroundFit): CSSProperties {
  switch (fit) {
    case "fill": return { objectFit: "cover" };
    case "fit": return { objectFit: "contain" };
    case "stretch": return { objectFit: "fill" };
    case "tile": return { objectFit: "cover" };
    case "center": return { objectFit: "none" };
  }
}

function dimColor(dim: number): string | undefined {
  if (dim === 0) return undefined;
  const alpha = Math.min(Math.abs(dim), 100) / 100;
  return dim < 0
    ? `rgba(0, 0, 0, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;
}

export interface TerminalBackgroundPopoverProps {
  background: DashboardBackground | null;
  onBackgroundChange: (background: DashboardBackground | null) => void;
  onClose: () => void;
}

export function TerminalBackgroundPopover({
  background,
  onBackgroundChange,
  onClose,
}: TerminalBackgroundPopoverProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<Mode>(modeOf(background));
  const [importError, setImportError] = useState("");
  const mediaBackground = isMediaBackground(background) ? background : null;

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function applyDefault() {
    setMode("default");
    onBackgroundChange(null);
  }

  function applyPreset(presetId: string) {
    setMode("preset");
    onBackgroundChange({ kind: "preset", preset: presetId });
  }

  function applyDynamic(dynamicId: string) {
    setMode("dynamic");
    onBackgroundChange({ kind: "dynamic", dynamic: dynamicId });
  }

  function applyMediaPatch(patch: Partial<Omit<MediaBackground, "kind">>) {
    const base: MediaBackground = mediaBackground ?? { kind: "image", file: "", fit: "fill", dim: 0 };
    if (!base.file && !patch.file) return;
    onBackgroundChange({ ...base, ...patch });
  }

  async function chooseMedia() {
    setImportError("");
    try {
      let sourcePath: string | null = null;
      if (isTauriRuntime()) {
        const selected = await openDialog({
          directory: false,
          multiple: false,
          title: t("dashboard.backgroundChooseMedia"),
          filters: [{
            name: t("dashboard.backgroundMediaFilter"),
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "mp4", "webm", "mov", "m4v", "ogv"],
          }],
        });
        sourcePath = typeof selected === "string" ? selected : null;
      } else {
        sourcePath = "preview-media.png";
      }
      if (!sourcePath) return;
      const file = await importBackgroundImage(sourcePath);
      await loadBackgroundImage(file);
      setMode("media");
      const base = mediaBackground ?? { fit: "fill" as BackgroundFit, dim: 0 };
      onBackgroundChange({ kind: mediaKindForFile(file), file, fit: base.fit, dim: base.dim });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div ref={ref} className="dw-bg-popover terminal-bg-popover">
      <header className="dw-bg-popover-head">{t("terminal.background")}</header>

      <div className="dw-bg-seg">
        <button className={mode === "default" ? "active" : ""} onClick={applyDefault} type="button">
          {t("dashboard.backgroundModeDefault")}
        </button>
        <button className={mode === "preset" ? "active" : ""} onClick={() => setMode("preset")} type="button">
          {t("dashboard.backgroundModePreset")}
        </button>
        <button className={mode === "media" ? "active" : ""} onClick={() => setMode("media")} type="button">
          {t("dashboard.backgroundModeMedia")}
        </button>
        <button className={mode === "dynamic" ? "active" : ""} onClick={() => setMode("dynamic")} type="button">
          {t("dashboard.backgroundModeDynamic")}
        </button>
      </div>

      {mode === "default" && <p className="dw-muted">{t("terminal.backgroundDefaultHint")}</p>}

      {mode === "preset" && (
        <div className="dw-bg-preset-grid">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={background?.kind === "preset" && background.preset === preset.id ? "active" : ""}
              style={{ background: preset.css }}
              title={t(preset.labelKey)}
              aria-label={t(preset.labelKey)}
              onClick={() => applyPreset(preset.id)}
              type="button"
            />
          ))}
        </div>
      )}

      {mode === "dynamic" && (
        <div className="dw-bg-dynamic">
          <div className="dw-bg-dynamic-grid">
            {DYNAMIC_BACKGROUNDS.map((backgroundOption) => (
              <button
                key={backgroundOption.id}
                className={background?.kind === "dynamic" && background.dynamic === backgroundOption.id ? "active" : ""}
                onClick={() => applyDynamic(backgroundOption.id)}
                type="button"
              >
                {t(backgroundOption.labelKey)}
              </button>
            ))}
          </div>
          <p className="dw-warning-text">{t("dashboard.backgroundDynamicHint")}</p>
        </div>
      )}

      {mode === "media" && (
        <div className="dw-bg-image">
          <div className="dw-bg-image-actions">
            <button className="dw-secondary-button" onClick={() => { void chooseMedia(); }} type="button">
              {t("dashboard.backgroundChooseMedia")}
            </button>
            {mediaBackground && (
              <button className="dw-secondary-button" onClick={applyDefault} type="button">
                {t("dashboard.backgroundRemoveImage")}
              </button>
            )}
          </div>
          <p className="dw-muted">
            {t("dashboard.backgroundMediaSourcePrefix")}{" "}
            <a
              href="https://pixabay.com/videos/search/wallpaper"
              onClick={(event) => {
                event.preventDefault();
                void openExternalUrl("https://pixabay.com/videos/search/wallpaper");
              }}
            >
              {t("dashboard.backgroundMediaSourceLink")}
            </a>
          </p>
          {importError && <small className="dw-muted">{importError}</small>}
          {mediaBackground && (
            <>
              <label className="dw-field">
                <span>{t("dashboard.backgroundFitLabel")}</span>
                <select
                  value={mediaBackground.fit}
                  onChange={(event) => applyMediaPatch({ fit: event.target.value as BackgroundFit })}
                >
                  {BACKGROUND_FITS.map((fit) => (
                    <option key={fit} value={fit}>{t(`dashboard.backgroundFit.${fit}`)}</option>
                  ))}
                </select>
              </label>
              <label className="dw-field">
                <span>{t("dashboard.backgroundDimLabel")}</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={mediaBackground.dim}
                  onChange={(event) => applyMediaPatch({ dim: Number(event.target.value) })}
                />
                <small className="dw-muted">{mediaBackground.dim}</small>
              </label>
            </>
          )}
          {!mediaBackground && <p className="dw-muted">{t("dashboard.backgroundMediaHint")}</p>}
        </div>
      )}
    </div>
  );
}

export function TerminalBackgroundLayer({
  active,
  background,
}: {
  active: boolean;
  background: DashboardBackground | null | undefined;
}) {
  const [mediaDataUrl, setMediaDataUrl] = useState("");
  const mediaFile = background?.kind === "image" || background?.kind === "video" ? background.file : "";

  useEffect(() => {
    let cancelled = false;
    setMediaDataUrl("");
    if (!mediaFile) return;
    void loadBackgroundImage(mediaFile).then((dataUrl) => {
      if (!cancelled) setMediaDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaFile]);

  if (!background) return null;

  let layer: JSX.Element | null = null;
  if (background.kind === "preset") {
    layer = <div className="terminal-bg-layer-fill" style={{ background: resolveBackgroundPreset(background.preset).css }} />;
  } else if (background.kind === "dynamic") {
    layer = <DashboardDynamicBackground active={active} id={background.dynamic} />;
  } else if (background.kind === "image" && mediaDataUrl) {
    const style: CSSProperties = {
      backgroundImage: `url("${mediaDataUrl}")`,
      ...backgroundFitStyle(background.fit),
    };
    const dim = dimColor(background.dim);
    if (dim) (style as Record<string, string>)["--terminal-bg-dim-color"] = dim;
    layer = <div className="terminal-bg-layer-fill terminal-bg-media" style={style} />;
  } else if (background.kind === "video" && mediaDataUrl) {
    const dim = dimColor(background.dim);
    const style = dim ? ({ "--terminal-bg-dim-color": dim } as CSSProperties) : undefined;
    layer = (
      <div className="terminal-bg-layer-fill terminal-bg-media" style={style}>
        <video aria-hidden="true" autoPlay loop muted playsInline src={mediaDataUrl} style={videoFitStyle(background.fit)} />
      </div>
    );
  }

  return layer ? <div className="terminal-connection-background" aria-hidden="true">{layer}</div> : null;
}
