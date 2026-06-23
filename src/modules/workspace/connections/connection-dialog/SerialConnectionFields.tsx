import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { technicalInputProps } from "../../../../lib/inputBehavior";
import { isMacPlatform, isWindowsPlatform } from "../../../../lib/platform";
import { invokeCommand } from "../../../../lib/tauri";
import type { Connection } from "../../../../types";

function platformDefaultLine(): string {
  if (isWindowsPlatform()) return "COM1";
  if (isMacPlatform()) return "/dev/cu.";
  return "/dev/ttyUSB0";
}

export function SerialConnectionFields({ initialConnection }: { initialConnection?: Connection }) {
  const { t } = useTranslation();
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [ports, setPorts] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const initialLine = initialConnection?.serialLine ?? initialConnection?.host ?? platformDefaultLine();
  const [line, setLine] = useState(initialLine);

  const refreshPorts = useCallback(
    (prefill: boolean) => {
      invokeCommand("list_serial_ports")
        .then((detected) => {
          setPorts(detected);
          // Pre-fill the first detected port only when the user hasn't already
          // provided a line (new connection still showing the platform default).
          if (prefill && detected[0] && initialLine === platformDefaultLine()) {
            setLine((current) => (current === platformDefaultLine() ? detected[0] : current));
          }
        })
        .catch(() => setPorts([]));
    },
    [initialLine],
  );

  useEffect(() => {
    refreshPorts(true);
  }, [refreshPorts]);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleOpen = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) refreshPorts(false); // re-scan on open to catch hot-plugged devices
      return !wasOpen;
    });
  };

  const selectPort = (port: string) => {
    setLine(port);
    setOpen(false);
  };

  return (
    <>
      <label>
        <span>{t("connections.nameOptional")}</span>
        <input name="name" defaultValue={initialConnection?.name ?? ""} placeholder={t("connections.connectionName")} />
      </label>
      <div className="connection-endpoint-fields">
        <label className="endpoint-host-input">
          <span>{t("connections.line")}*</span>
          <div className={`serial-line-combobox${open ? " open" : ""}`} ref={wrapperRef}>
            <input
              name="serialLine"
              {...technicalInputProps}
              value={line}
              onChange={(event) => setLine(event.currentTarget.value)}
              placeholder={t("connections.serialLinePlaceholder")}
              required
            />
            <button
              type="button"
              className="serial-line-combobox-toggle"
              aria-label={t("connections.serialLineDetect")}
              aria-expanded={open}
              aria-controls={listId}
              onClick={toggleOpen}
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                <path
                  d="M6 8l4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {open && (
              <ul className="serial-line-combobox-list" id={listId} role="listbox">
                {ports.length === 0 ? (
                  <li className="serial-line-combobox-empty" aria-disabled="true">
                    {t("connections.serialLineNoneDetected")}
                  </li>
                ) : (
                  ports.map((port) => (
                    <li key={port}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={port === line}
                        className={port === line ? "selected" : ""}
                        onClick={() => selectPort(port)}
                      >
                        {port}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </label>
        <label className="endpoint-port-input">
          <span>{t("connections.speed")}*</span>
          <input
            name="serialSpeed"
            defaultValue={initialConnection?.serialSpeed ?? 9600}
            inputMode="numeric"
            min="1"
            type="number"
            placeholder="9600"
            required
          />
        </label>
      </div>
    </>
  );
}
