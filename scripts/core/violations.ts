import { Player, system } from "@minecraft/server";
import { flagAlert } from "./alerts";
import { pushLog } from "./history";
import { Profile } from "./profile";
import { punishForCheck } from "./punish";
import { checkState, settings } from "./settings";

const alertGap = 4;

export function flag(player: Player, profile: Profile, checkId: string, detail: string) {
  const state = checkState(checkId);
  if (state === undefined || !state.enabled) return;

  const currentTick = system.currentTick;
  let record = profile.violations.get(checkId);
  if (record === undefined) {
    record = { count: 0, lastTick: currentTick };
    profile.violations.set(checkId, record);
  }

  const decayTicks = settings.decaySeconds * 20;
  if (decayTicks > 0 && currentTick - record.lastTick > decayTicks) {
    const decayed = Math.floor((currentTick - record.lastTick) / decayTicks);
    record.count = Math.max(0, record.count - decayed);
  }

  record.count++;
  record.lastTick = currentTick;
  profile.totalFlags++;

  pushLog({
    time: Date.now(),
    player: profile.name,
    check: state.definition.label,
    detail,
    count: record.count,
  });

  if (currentTick - profile.lastAlertTick >= alertGap) {
    profile.lastAlertTick = currentTick;
    flagAlert(profile.name, state.definition.label, detail, record.count, state.threshold);
  }

  if (record.count >= state.threshold) {
    record.count = 0;
    punishForCheck(player, profile, state.definition.label, state.action);
  }
}

export function clearViolations(profile: Profile) {
  profile.violations.clear();
  profile.totalFlags = 0;
}

export function violationSummary(profile: Profile) {
  const rows: { label: string; count: number }[] = [];
  for (const [id, record] of profile.violations) {
    if (record.count <= 0) continue;
    const state = checkState(id);
    if (state === undefined) continue;
    rows.push({ label: state.definition.label, count: record.count });
  }
  return rows.sort((a, b) => b.count - a.count);
}
