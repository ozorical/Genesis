import { Player, system } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, FormCancelationReason, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";

const busyRetries = 10;
const busyDelay = 10;

export async function showAction(player: Player, form: ActionFormData): Promise<ActionFormResponse> {
  let response = await form.show(player);
  let attempts = 0;
  while (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy && attempts < busyRetries) {
    attempts++;
    await waitTicks(busyDelay);
    response = await form.show(player);
  }
  return response;
}

export async function showModal(player: Player, form: ModalFormData): Promise<ModalFormResponse> {
  let response = await form.show(player);
  let attempts = 0;
  while (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy && attempts < busyRetries) {
    attempts++;
    await waitTicks(busyDelay);
    response = await form.show(player);
  }
  return response;
}

export function waitTicks(ticks: number) {
  return new Promise<void>((resolve) => system.runTimeout(resolve, ticks));
}

export function toggleLabel(enabled: boolean) {
  return enabled ? "§aOn" : "§cOff";
}
