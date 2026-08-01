import { Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { CheckAction, CheckGroup, checkDefinitions, groupIcons, groupLabels } from "../config/checks";
import { allCheckStates, checkState, saveCheckState } from "../core/settings";
import { showAction, showModal, toggleLabel } from "./forms";
import { icons } from "./icons";
import { openPanel } from "./panel";

const actionOrder: CheckAction[] = ["log", "setback", "kick", "ban"];
const actionLabels = ["Log only", "Set back", "Kick", "Ban"];

export async function openGroups(player: Player) {
  const groups = Object.keys(groupLabels) as CheckGroup[];
  const form = new ActionFormData().title("Detections").header("Pick a category");

  for (const group of groups) {
    const states = statesInGroup(group);
    const active = states.filter((state) => state.enabled).length;
    form.button("§7" + groupLabels[group] + "\n§8" + active + " of " + states.length + " active", groupIcons[group]);
  }
  form.button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection >= groups.length) {
    await openPanel(player);
    return;
  }
  await openGroup(player, groups[response.selection]);
}

async function openGroup(player: Player, group: CheckGroup) {
  const states = statesInGroup(group);
  const form = new ActionFormData().title(groupLabels[group]).header("Tap a detection to configure it");

  for (const state of states) {
    form.button("§7" + state.definition.label + "\n" + toggleLabel(state.enabled) + " §8| " + labelFor(state.action), state.enabled ? icons.enabled : icons.disabled);
  }
  form.button("§8Back", icons.back);

  const response = await showAction(player, form);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection >= states.length) {
    await openGroups(player);
    return;
  }
  await openCheck(player, states[response.selection].definition.id, group);
}

async function openCheck(player: Player, checkId: string, group: CheckGroup) {
  const state = checkState(checkId);
  if (state === undefined) return;

  const form = new ModalFormData()
    .title(state.definition.label)
    .label("§7" + state.definition.summary)
    .divider()
    .toggle("Enabled", { defaultValue: state.enabled })
    .dropdown("Action at limit", actionLabels, { defaultValueIndex: actionOrder.indexOf(state.action) })
    .slider("Violations before action", 1, 30, { defaultValue: state.threshold, valueStep: 1 })
    .submitButton("Save");

  const response = await showModal(player, form);
  if (response.canceled || response.formValues === undefined) {
    await openGroup(player, group);
    return;
  }

  state.enabled = response.formValues[2] as boolean;
  state.action = actionOrder[response.formValues[3] as number];
  state.threshold = response.formValues[4] as number;
  saveCheckState(state);

  await openGroup(player, group);
}

function statesInGroup(group: CheckGroup) {
  const wanted = checkDefinitions.filter((definition) => definition.group === group).map((definition) => definition.id);
  return allCheckStates().filter((state) => wanted.indexOf(state.definition.id) !== -1);
}

function labelFor(action: CheckAction) {
  return "§8" + actionLabels[actionOrder.indexOf(action)];
}
