import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { addBan } from "../core/bans";
import { logsFor } from "../core/history";
import { bypassTag, isFrozen, isStaff } from "../core/permissions";
import { profileOf } from "../core/profile";
import { freezePlayer, kickPlayer, notify, unfreezePlayer } from "../core/punish";
import { settings } from "../core/settings";
import { clearViolations, violationSummary } from "../core/violations";
import { formatClock } from "../util/format";
import { showAction, showModal } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

export async function openPlayers(player: Player) {
  const online = world.getAllPlayers();
  const form = new ActionFormData().title("Players").header("Online now");

  for (const target of online) {
    const profile = profileOf(target);
    const marks = [];
    if (isStaff(target)) marks.push("§bstaff");
    if (isFrozen(target)) marks.push("§9frozen");
    if (target.hasTag(bypassTag)) marks.push("§7bypass");
    const tail = marks.length > 0 ? " §8| " + marks.join("§8, ") : "";
    form.button("§7" + target.name + "\n§8" + profile.totalFlags + " flags" + tail, isStaff(target) ? icons.staff : icons.player);
  }
  form.button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection >= online.length) {
    await openPanel(player);
    return;
  }
  await openPlayerActions(player, online[response.selection]);
}

async function openPlayerActions(staff: Player, target: Player) {
  const profile = profileOf(target);
  const summary = violationSummary(profile);
  const body = summary.length === 0 ? "§7No active violations." : summary.map((row) => "§7" + row.label + " §f" + row.count).join("\n");

  const form = new ActionFormData()
    .title(target.name)
    .label(body)
    .divider()
    .button("§7Recent Flags", icons.logs)
    .button(isFrozen(target) ? "§7Unfreeze" : "§7Freeze", icons.freeze)
    .button(target.hasTag(bypassTag) ? "§7Remove Bypass" : "§7Grant Bypass", icons.staff)
    .button("§7Clear Violations", icons.clear)
    .button("§7Kick", icons.kick)
    .button("§7Ban", icons.ban)
    .button("§8Back", icons.back);

  const response = await showAction(staff, form);
  if (response.canceled || response.selection === undefined) return;

  switch (response.selection) {
    case 0:
      await openPlayerLogs(staff, target);
      break;
    case 1:
      if (isFrozen(target)) {
        unfreezePlayer(target);
        notify(staff, "Unfroze " + target.name);
      } else {
        freezePlayer(target);
        notify(staff, "Froze " + target.name);
      }
      await openPlayerActions(staff, target);
      break;
    case 2:
      if (target.hasTag(bypassTag)) {
        target.removeTag(bypassTag);
        notify(staff, "Removed bypass from " + target.name);
      } else {
        target.addTag(bypassTag);
        notify(staff, "Granted bypass to " + target.name);
      }
      await openPlayerActions(staff, target);
      break;
    case 3:
      clearViolations(profile);
      notify(staff, "Cleared violations for " + target.name);
      await openPlayerActions(staff, target);
      break;
    case 4:
      kickPlayer(target, "Removed by " + staff.name);
      notify(staff, "Kicked " + target.name);
      break;
    case 5:
      await openBanForm(staff, target);
      break;
    default:
      await openPlayers(staff);
      break;
  }
}

async function openPlayerLogs(staff: Player, target: Player) {
  const rows = logsFor(target.name, 20);
  const body = rows.length === 0 ? "§7Nothing recorded yet." : rows.map((row) => "§8" + formatClock(row.time) + " §f" + row.check + " §7" + row.detail).join("\n");

  const form = new ActionFormData().title(target.name + " Flags").label(body).divider().button("§8Back", icons.back);
  await showAction(staff, form);
  await openPlayerActions(staff, target);
}

async function openBanForm(staff: Player, target: Player) {
  const form = new ModalFormData()
    .title("Ban " + target.name)
    .textField("Reason", "Cheating", { defaultValue: "Cheating" })
    .slider("Days, zero means permanent", 0, 90, { defaultValue: settings.banDays, valueStep: 1 })
    .submitButton("Confirm");

  const response = await showModal(staff, form);
  if (response.canceled || response.formValues === undefined) {
    await openPlayerActions(staff, target);
    return;
  }

  const reason = (response.formValues[0] as string) || "Cheating";
  const days = response.formValues[1] as number;
  addBan(target.name, reason, staff.name, days);
  kickPlayer(target, reason);
  notify(staff, "Banned " + target.name + " for " + reason);
}
