import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { performanceStats, resetPeak } from "../core/loop";
import { allCheckStates } from "../core/settings";
import { showAction } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

export async function openStatus(player: Player) {
  const stats = performanceStats();
  const active = allCheckStates().filter((state) => state.enabled).length;

  const lines = [
    "§7Ticks per second §f" + stats.ticksPerSecond,
    "§7Average tick cost §f" + stats.averageCost + " ms",
    "§7Peak tick cost §f" + stats.peakCost + " ms",
    "§7Players sampled §f" + stats.players,
    "§7Tick checks §f" + stats.checks,
    "§7Detections active §f" + active + " of " + allCheckStates().length,
    "§7Load guard §f" + (stats.shedding ? "§eshedding heavy checks" : "§aidle"),
  ];

  const form = new ActionFormData()
    .title("Performance")
    .label(lines.join("\n"))
    .divider()
    .button("§7Refresh", icons.refresh)
    .button("§7Reset Peak", icons.clear)
    .button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;

  if (response.selection === 0) {
    await openStatus(player);
    return;
  }
  if (response.selection === 1) {
    resetPeak();
    await openStatus(player);
    return;
  }
  await openPanel(player);
}
