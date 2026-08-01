import { system, world } from "@minecraft/server";
import { inventoryTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { isContainer } from "../../util/blocks";

export function registerChestAura() {
  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    if (!event.isFirstEvent) return;
    if (!isContainer(event.block.typeId)) return;

    const player = event.player;
    if (isExempt(player)) return;

    const profile = profileOf(player);
    const currentTick = system.currentTick;
    profile.containerTimes.push(currentTick);

    while (profile.containerTimes.length > 0 && currentTick - profile.containerTimes[0] > inventoryTuning.containerWindow) {
      profile.containerTimes.shift();
    }

    if (profile.containerTimes.length < inventoryTuning.containerCount) return;

    profile.containerTimes.length = 0;
    flag(player, profile, "chestAura", "opened " + inventoryTuning.containerCount + " containers in " + inventoryTuning.containerWindow + " ticks");
  });
}
