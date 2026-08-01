import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { performanceStats } from "../core/loop";
import { openAbout } from "./aboutMenu";
import { openBans } from "./bansMenu";
import { openGroups } from "./checksMenu";
import { showAction } from "./forms";
import { icons } from "./icons";
import { openLogs } from "./logsMenu";
import { openPlayers } from "./playersMenu";
import { openSettings } from "./settingsMenu";
import { openStatus } from "./statusMenu";

export async function openPanel(player: Player) {
  const stats = performanceStats();
  const form = new ActionFormData()
    .title("Genesis")
    .header("The First MCBE Anticheat built for Realms")
    .label("§7Lightweight, and reliable.")
    .divider()
    .label("§7Online §f" + stats.players + "§7 of 11    Rate §f" + stats.ticksPerSecond + "§7 tps    Cost §f" + stats.averageCost + "§7 ms")
    .divider()
    .button("§7Players", icons.players)
    .button("§7Detections", icons.checks)
    .button("§7Violation Log", icons.logs)
    .button("§7Ban List", icons.bans)
    .button("§7Performance", icons.status)
    .button("§7Settings", icons.general)
    .button("§7About", icons.about);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;

  switch (response.selection) {
    case 0:
      await openPlayers(player);
      break;
    case 1:
      await openGroups(player);
      break;
    case 2:
      await openLogs(player);
      break;
    case 3:
      await openBans(player);
      break;
    case 4:
      await openStatus(player);
      break;
    case 5:
      await openSettings(player);
      break;
    default:
      await openAbout(player);
      break;
  }
}
