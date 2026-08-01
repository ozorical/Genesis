import { Player, PlayerPermissionLevel } from "@minecraft/server";
import { settings } from "./settings";

export const staffTag = "genesis:staff";
export const bypassTag = "genesis:bypass";
export const frozenTag = "genesis:frozen";
export const alertTag = "genesis:alerts";

export function isStaff(player: Player) {
  return player.playerPermissionLevel === PlayerPermissionLevel.Operator || player.hasTag(staffTag);
}

export function isExempt(player: Player) {
  if (player.hasTag(bypassTag)) return true;
  return settings.staffBypass && isStaff(player);
}

export function isFrozen(player: Player) {
  return player.hasTag(frozenTag);
}

export function wantsAlerts(player: Player) {
  return isStaff(player) && player.hasTag(alertTag);
}
