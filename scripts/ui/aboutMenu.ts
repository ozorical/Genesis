import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { checkDefinitions } from "../config/checks";
import { version } from "../config/version";
import { showAction } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

export async function openAbout(player: Player) {
  const lines = [
    "§aGenesis Anticheat §7" + version,
    "",
    "§7The First MCBE Anticheat built for Realms.",
    "§7Lightweight, and reliable.",
    "",
    "§7Built by §fOzz",
    "§7Detections §f" + checkDefinitions.length,
    "§7Runs on the stable scripting API, so a Realm",
    "§7needs no experimental toggles to use it.",
  ];

  const form = new ActionFormData().title("About").label(lines.join("\n")).divider().button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;
  await openPanel(player);
}
