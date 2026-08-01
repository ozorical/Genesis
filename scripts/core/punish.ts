import { InputPermissionCategory, Player, system, world } from "@minecraft/server";
import { prefix } from "../util/format";
import { sendAlert } from "./alerts";
import { addBan } from "./bans";
import { frozenTag } from "./permissions";
import { Profile } from "./profile";
import { settings } from "./settings";

export function setback(player: Player, profile: Profile) {
  try {
    player.clearVelocity();
    player.teleport(profile.safePosition);
    profile.clearMovementStreaks();
    profile.grace(system.currentTick, 10);
  } catch {
    return;
  }
}

export function kickPlayer(player: Player, reason: string) {
  const name = player.name;
  system.run(() => {
    try {
      world.getDimension("overworld").runCommand('kick "' + name + '" ' + reason);
    } catch {
      freezePlayer(player);
    }
  });
}

export function banPlayer(player: Player, reason: string, staff: string, days: number) {
  addBan(player.name, reason, staff, days);
  kickPlayer(player, reason);
}

export function freezePlayer(player: Player) {
  player.addTag(frozenTag);
  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, false);
  } catch {
    return;
  }
}

export function unfreezePlayer(player: Player) {
  player.removeTag(frozenTag);
  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, true);
  } catch {
    return;
  }
}

export function punishForCheck(player: Player, profile: Profile, label: string, action: string) {
  if (!settings.punishments) return;
  switch (action) {
    case "setback":
      setback(player, profile);
      break;
    case "kick":
      sendAlert("§c" + player.name + " §7was removed for §f" + label);
      kickPlayer(player, "Genesis detected " + label);
      break;
    case "ban":
      sendAlert("§c" + player.name + " §7was banned for §f" + label);
      banPlayer(player, "Genesis detected " + label, "Genesis", settings.banDays);
      break;
    default:
      break;
  }
}

export function notify(player: Player, message: string) {
  player.sendMessage(prefix + message);
}
