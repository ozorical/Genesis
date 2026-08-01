import { Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { notify } from "../core/punish";
import { resetSettings, saveGeneral, settings } from "../core/settings";
import { showAction, showModal } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

export async function openSettings(player: Player) {
  const form = new ModalFormData()
    .title("Settings")
    .toggle("Staff alerts", { defaultValue: settings.alerts })
    .toggle("Automatic punishments", { defaultValue: settings.punishments })
    .toggle("Staff bypass detections", { defaultValue: settings.staffBypass })
    .toggle("Load guard", { defaultValue: settings.loadGuard })
    .slider("Default ban length in days, zero means permanent", 0, 90, { defaultValue: settings.banDays, valueStep: 1 })
    .slider("Violation decay in seconds", 10, 180, { defaultValue: settings.decaySeconds, valueStep: 5 })
    .slider("Log size", 20, 200, { defaultValue: settings.logSize, valueStep: 10 })
    .slider("Load guard trigger in ticks per second", 5, 19, { defaultValue: settings.minTicksPerSecond, valueStep: 1 })
    .submitButton("Save");

  const response = await showModal(player, form);
  if (response.canceled || response.formValues === undefined) {
    await openPanel(player);
    return;
  }

  settings.alerts = response.formValues[0] as boolean;
  settings.punishments = response.formValues[1] as boolean;
  settings.staffBypass = response.formValues[2] as boolean;
  settings.loadGuard = response.formValues[3] as boolean;
  settings.banDays = response.formValues[4] as number;
  settings.decaySeconds = response.formValues[5] as number;
  settings.logSize = response.formValues[6] as number;
  settings.minTicksPerSecond = response.formValues[7] as number;
  saveGeneral();

  notify(player, "Settings saved");
  await openMaintenance(player);
}

async function openMaintenance(player: Player) {
  const form = new ActionFormData()
    .title("Settings")
    .label("§7Settings saved. Anything else?")
    .divider()
    .button("§7Restore Detection Defaults", icons.refresh)
    .button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;

  if (response.selection === 0) {
    resetSettings();
    notify(player, "Restored every detection to its default");
  }
  await openPanel(player);
}
