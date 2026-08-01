import { system, world } from "@minecraft/server";
import { worldTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { isOre, isStone } from "../../util/blocks";
import { roundTo } from "../../util/math";

export function registerXray() {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    if (isExempt(player)) return;
    if (player.location.y > 40) return;

    const typeId = event.brokenBlockPermutation.type.id;
    const ore = isOre(typeId);
    if (!ore && !isStone(typeId)) return;

    const profile = profileOf(player);
    const currentTick = system.currentTick;
    if (currentTick - profile.oreWindowStart > worldTuning.xrayResetTicks) {
      profile.oreWindowStart = currentTick;
      profile.oresMined = 0;
      profile.stoneMined = 0;
    }

    if (ore) profile.oresMined++;
    else profile.stoneMined++;

    const total = profile.oresMined + profile.stoneMined;
    if (total < worldTuning.xraySampleSize) return;

    const ratio = profile.oresMined / total;
    profile.oresMined = 0;
    profile.stoneMined = 0;
    profile.oreWindowStart = currentTick;

    if (ratio > worldTuning.xrayOreRatio) {
      flag(player, profile, "xray", "mined " + roundTo(ratio * 100, 1) + " percent ore over " + total + " blocks");
    }
  });
}
