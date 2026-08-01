import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { clearLogs, logCount, recentLogs } from "../core/history";
import { notify } from "../core/punish";
import { formatClock } from "../util/format";
import { showAction } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

export async function openLogs(player: Player) {
  const rows = recentLogs(25);
  const body =
    rows.length === 0
      ? "§7No violations recorded."
      : rows.map((row) => "§8" + formatClock(row.time) + " §c" + row.player + " §f" + row.check + " §7" + row.detail).join("\n");

  const form = new ActionFormData()
    .title("Violation Log")
    .label(body)
    .divider()
    .label("§7Holding the last " + logCount() + " entries")
    .button("§7Refresh", icons.refresh)
    .button("§7Clear Log", icons.clear)
    .button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;

  if (response.selection === 0) {
    await openLogs(player);
    return;
  }
  if (response.selection === 1) {
    clearLogs();
    notify(player, "Cleared the violation log");
    await openLogs(player);
    return;
  }
  await openPanel(player);
}
