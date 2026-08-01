import { settings } from "./settings";

export interface LogEntry {
  time: number;
  player: string;
  check: string;
  detail: string;
  count: number;
}

const entries: LogEntry[] = [];

export function pushLog(entry: LogEntry) {
  entries.unshift(entry);
  while (entries.length > settings.logSize) entries.pop();
}

export function recentLogs(limit: number) {
  return entries.slice(0, limit);
}

export function logsFor(playerName: string, limit: number) {
  const found: LogEntry[] = [];
  for (const entry of entries) {
    if (entry.player === playerName) found.push(entry);
    if (found.length >= limit) break;
  }
  return found;
}

export function clearLogs() {
  entries.length = 0;
}

export function logCount() {
  return entries.length;
}
