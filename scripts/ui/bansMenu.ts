import { Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { BanRecord, addBan, listBans, removeBan } from "../core/bans";
import { notify } from "../core/punish";
import { formatDuration } from "../util/format";
import { showAction, showModal } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

export async function openBans(player: Player) {
  const records = listBans();
  const form = new ActionFormData().title("Ban List").header(records.length + " active bans");

  for (const record of records) {
    form.button("§7" + record.name + "\n§8" + shortLine(record), icons.ban);
  }
  form.button("§7Add Ban", icons.warning);
  form.button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;

  if (response.selection === records.length) {
    await openAddBan(player);
    return;
  }
  if (response.selection > records.length) {
    await openPanel(player);
    return;
  }
  await openBanRecord(player, records[response.selection]);
}

async function openBanRecord(player: Player, record: BanRecord) {
  const form = new ActionFormData()
    .title(record.name)
    .label("§7Reason §f" + record.reason + "\n§7Issued by §f" + record.staff + "\n§7Expires §f" + expiryOf(record))
    .divider()
    .button("§7Lift Ban", icons.enabled)
    .button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;

  if (response.selection === 0) {
    removeBan(record.name);
    notify(player, "Lifted the ban on " + record.name);
  }
  await openBans(player);
}

async function openAddBan(player: Player) {
  const form = new ModalFormData()
    .title("Add Ban")
    .textField("Player name", "Exact gamertag")
    .textField("Reason", "Cheating", { defaultValue: "Cheating" })
    .slider("Days, zero means permanent", 0, 90, { defaultValue: 0, valueStep: 1 })
    .submitButton("Confirm");

  const response = await showModal(player, form);
  if (response.canceled || response.formValues === undefined) {
    await openBans(player);
    return;
  }

  const name = (response.formValues[0] as string).trim();
  if (name.length === 0) {
    notify(player, "That name was empty");
    await openBans(player);
    return;
  }

  addBan(name, (response.formValues[1] as string) || "Cheating", player.name, response.formValues[2] as number);
  notify(player, "Banned " + name);
  await openBans(player);
}

function shortLine(record: BanRecord) {
  return record.reason + " §8| " + expiryOf(record);
}

function expiryOf(record: BanRecord) {
  return record.until === 0 ? "never" : formatDuration(record.until - Date.now());
}
