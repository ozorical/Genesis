import { dropValue, keysWithPrefix, readValue, writeValue } from "./storage";

export interface BanRecord {
  name: string;
  reason: string;
  staff: string;
  created: number;
  until: number;
}

const banPrefix = "genesis:ban:";

function keyFor(name: string) {
  return banPrefix + name.toLowerCase();
}

export function addBan(name: string, reason: string, staff: string, days: number) {
  const record: BanRecord = {
    name,
    reason,
    staff,
    created: Date.now(),
    until: days > 0 ? Date.now() + days * 86400000 : 0,
  };
  writeValue(keyFor(name), JSON.stringify(record));
  return record;
}

export function removeBan(name: string) {
  const key = keyFor(name);
  if (readValue(key, "").length === 0) return false;
  dropValue(key);
  return true;
}

export function findBan(name: string) {
  const key = keyFor(name);
  const raw = readValue(key, "");
  if (raw.length === 0) return undefined;
  let record: BanRecord;
  try {
    record = JSON.parse(raw) as BanRecord;
  } catch {
    dropValue(key);
    return undefined;
  }
  if (record.until > 0 && Date.now() >= record.until) {
    dropValue(key);
    return undefined;
  }
  return record;
}

export function listBans() {
  const records: BanRecord[] = [];
  for (const key of keysWithPrefix(banPrefix)) {
    const raw = readValue(key, "");
    if (raw.length === 0) continue;
    try {
      records.push(JSON.parse(raw) as BanRecord);
    } catch {
      dropValue(key);
    }
  }
  return records.sort((a, b) => b.created - a.created);
}
