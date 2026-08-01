import { Player } from "@minecraft/server";
import { movementTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { movementReady } from "../../core/snapshot";
import { flag } from "../../core/violations";
import { roundTo } from "../../util/math";

function run(player: Player, profile: Profile, currentTick: number) {
  if (!movementReady(profile, currentTick)) return;
  if (!profile.onGround || profile.inWater) return;

  const speedBonus = 1 + movementTuning.speedEffectBonus * profile.speedAmplifier;

  if (currentTick < profile.itemUseUntil && profile.horizontalSpeed > movementTuning.itemUseSpeed * speedBonus) {
    flag(player, profile, "noSlow", "used an item at " + roundTo(profile.horizontalSpeed, 3));
    return;
  }

  if (profile.sneaking && profile.horizontalSpeed > movementTuning.sneakSpeed * speedBonus) {
    flag(player, profile, "noSlow", "sneaked at " + roundTo(profile.horizontalSpeed, 3));
  }
}

registerTick({ id: "noSlow", interval: 2, heavy: false, run });
