import { parseIPv4, formatIPv4 } from "../subnet-calculator/subnetMath";

export interface PingTarget {
  host: string;
  source: "ip" | "cidr";
}

export interface ParsedPingTargets {
  targets: PingTarget[];
  truncated: boolean;
}

export interface PingReplyLike {
  seq: number;
  ok: boolean;
  rttMs?: number | null;
}

export interface PingSummary {
  sent: number;
  received: number;
  currentMs: number | null;
  averageMs: number | null;
  packetLossPercent: number;
}

const IPV4_CIDR_RE = /\b((?:\d{1,3}\.){3}\d{1,3})(?:\s*\/\s*(\d{1,2}))?\b/g;

export function parsePingTargets(input: string, maxTargets = 256): ParsedPingTargets {
  const seen = new Set<string>();
  const targets: PingTarget[] = [];
  let truncated = false;

  for (const match of input.matchAll(IPV4_CIDR_RE)) {
    const ip = parseIPv4(match[1]);
    if (ip === null) continue;
    const prefixText = match[2];
    if (prefixText === undefined) {
      pushTarget(formatIPv4(ip), "ip");
      continue;
    }
    const prefix = Number(prefixText);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) continue;
    expandCidr(ip, prefix, (host) => pushTarget(host, "cidr"));
  }

  function pushTarget(host: string, source: PingTarget["source"]) {
    if (seen.has(host) || truncated) return;
    if (targets.length >= maxTargets) {
      truncated = true;
      return;
    }
    seen.add(host);
    targets.push({ host, source });
  }

  return { targets, truncated };
}

function expandCidr(ip: number, prefix: number, push: (host: string) => void) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = ip & mask;
  const size = 2 ** (32 - prefix);
  const first = prefix >= 31 ? network : network + 1;
  const last = prefix >= 31 ? network + size - 1 : network + size - 2;
  for (let current = first; current <= last; current += 1) {
    push(formatIPv4(current >>> 0));
  }
}

export function summarizePingReplies(replies: PingReplyLike[]): PingSummary {
  const receivedReplies = replies.filter((reply) => reply.ok && typeof reply.rttMs === "number");
  const current = receivedReplies.length > 0 ? receivedReplies[receivedReplies.length - 1].rttMs ?? null : null;
  const total = receivedReplies.reduce((sum, reply) => sum + (reply.rttMs ?? 0), 0);
  return {
    sent: replies.length,
    received: receivedReplies.length,
    currentMs: current,
    averageMs: receivedReplies.length > 0 ? total / receivedReplies.length : null,
    packetLossPercent:
      replies.length > 0 ? ((replies.length - receivedReplies.length) * 100) / replies.length : 0,
  };
}

export function formatPingSummary(summary: PingSummary): string {
  return `${formatMs(summary.currentMs)} now · ${formatMs(summary.averageMs)} avg · ${formatPercent(summary.packetLossPercent)} loss`;
}

export function formatMs(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 10) / 10} ms`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}
