import { world } from "@minecraft/server";
import { alertPrefix } from "../util/format";
import { wantsAlerts } from "./permissions";
import { settings } from "./settings";

export function sendAlert(message: string) {
  if (!settings.alerts) return;
  for (const player of world.getAllPlayers()) {
    if (wantsAlerts(player)) player.sendMessage(alertPrefix + message);
  }
}

export function flagAlert(playerName: string, label: string, detail: string, count: number, threshold: number) {
  sendAlert("§c" + playerName + " §7failed §f" + label + " §7[§f" + count + "§7/§f" + threshold + "§7] " + detail);
}
