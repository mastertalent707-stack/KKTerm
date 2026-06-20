// Placeholder automation fixtures for the IT Ops Module, ported from the
// redesign mockup (itops-data.jsx).
//
// Host Groups (Phase 1) and Batch Runs (Phase 2) are wired to the backend, so
// their fixtures are gone. The Automations list/builder still render against
// these fixtures until Phase 3 wires the durable Automation runtime (see
// docs/ITOPS.md). The values here are sample *content* — not translatable chrome.

import { IT_ACCENTS, type ItIconName } from "./icons";

// Still used by TransportChip (a chip rendered for both Host Groups and Runs).
export type Transport = "ssh" | "winrm" | "psexec" | "auto";

export type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  trigKind: ItIconName;
  trigColor: string;
  trigger: string;
  cond: string | null;
  actions: BuilderActionKind[];
  fired: string;
  runs: number;
};

export type BuilderActionKind = "bell" | "mail" | "run" | "bot" | "popup" | "webhook";

/* ----------------------------- automations ----------------------------- */
export const AUTOMATIONS: Automation[] = [
  { id: "a1", name: "Disk usage > 85% → alert + cleanup", enabled: true,
    trigKind: "gauge", trigColor: IT_ACCENTS.orange,
    trigger: "Disk usage  ·  db-primary", cond: "> 85%",
    actions: ["bell", "mail", "run"], fired: "fired 2h ago", runs: 14 },
  { id: "a2", name: "Nightly apt upgrade", enabled: true,
    trigKind: "calendar", trigColor: IT_ACCENTS.indigo,
    trigger: "Schedule  ·  every day 03:00", cond: null,
    actions: ["run", "bell"], fired: "next in 8h", runs: 62 },
  { id: "a3", name: "prod-web-01 output silence", enabled: true,
    trigKind: "pulse", trigColor: IT_ACCENTS.teal,
    trigger: "SSH output silence  ·  prod-web-01", cond: "for 5m",
    actions: ["bot"], fired: "armed · idle", runs: 3 },
  { id: "a4", name: "5xx spike webhook → page on-call", enabled: false,
    trigKind: "webhook", trigColor: IT_ACCENTS.purple,
    trigger: "Inbound webhook  ·  /hooks/alertmgr", cond: null,
    actions: ["popup", "run"], fired: "disabled", runs: 0 },
  { id: "a5", name: "TLS cert expiry < 14 days", enabled: true,
    trigKind: "globe", trigColor: IT_ACCENTS.green,
    trigger: "HTTP-JSON probe  ·  /metrics/cert", cond: "< 14 days",
    actions: ["mail"], fired: "fired yesterday", runs: 5 },
];

export type BuilderAction = {
  kind: BuilderActionKind;
  color: string;
  label: string;
  detail: string;
};

/* the automation opened in the builder (matches a1) */
export const BUILDER_AUTOMATION = {
  id: "a1",
  name: "Disk usage > 85% → alert + cleanup",
  enabled: true,
  trigger: {
    kind: "gauge" as ItIconName,
    color: IT_ACCENTS.orange,
    label: "Performance counter",
    detail: "Disk usage (%)",
    target: "db-primary · 10.0.4.31",
    poll: "every 60s",
  },
  condition: { op: "gt", label: "is greater than", value: "85", unit: "%" },
  actions: [
    { kind: "bell", color: IT_ACCENTS.blue, label: "Notify", detail: "Status Bar + toast + sound" },
    { kind: "mail", color: IT_ACCENTS.green, label: "Email", detail: "to ops@kkterm.io · SMTP via keychain" },
    { kind: "run", color: IT_ACCENTS.orange, label: "Run Batch", detail: "“Database Cluster” · playbook: clear journald + apt clean" },
  ] as BuilderAction[],
};
