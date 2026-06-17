import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";

/** Maximum data rows rendered at once to keep large CSVs responsive. */
const MAX_RENDERED_ROWS = 2000;

/**
 * Parses delimited text with papaparse and renders it as a table with a sticky
 * header and a quick row filter. The first row is treated as a header. A "raw"
 * toggle falls back to the underlying text.
 */
export function CsvViewer({ text, delimiter }: { text: string; delimiter?: string }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");

  const { header, rows, truncated } = useMemo(() => {
    const parsed = Papa.parse<string[]>(text.trim(), {
      delimiter: delimiter ?? "",
      skipEmptyLines: true,
    });
    const data = (parsed.data as string[][]) ?? [];
    const [first, ...rest] = data;
    return {
      header: first ?? [],
      rows: rest,
      truncated: rest.length > MAX_RENDERED_ROWS,
    };
  }, [text, delimiter]);

  const visibleRows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) => row.some((cell) => cell?.toLowerCase().includes(needle)))
      : rows;
    return filtered.slice(0, MAX_RENDERED_ROWS);
  }, [rows, filter]);

  return (
    <div className="file-viewer-csv">
      <div className="file-viewer-subtoolbar">
        <input
          className="file-viewer-filter"
          onChange={(event) => setFilter(event.currentTarget.value)}
          placeholder={t("workspace.fileViewer.filterRows")}
          value={filter}
        />
        <span className="file-viewer-rowcount">
          {t("workspace.fileViewer.rowCount", { count: visibleRows.length })}
        </span>
      </div>
      <div className="file-viewer-table-scroll">
        <table className="file-viewer-table">
          <thead>
            <tr>
              <th className="file-viewer-rownum">#</th>
              {header.map((cell, index) => (
                <th key={index}>{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="file-viewer-rownum">{rowIndex + 1}</td>
                {header.map((_, colIndex) => (
                  <td key={colIndex}>{row[colIndex] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated ? (
        <div className="file-viewer-notice">
          {t("workspace.fileViewer.tableTruncated", { count: MAX_RENDERED_ROWS })}
        </div>
      ) : null}
    </div>
  );
}
