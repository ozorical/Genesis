import { Player } from "@minecraft/server";
import { movementTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { movementReady } from "../../core/snapshot";
import { flag } from "../../core/violations";
import { standingOnSlippery } from "../../util/blocks";
import { roundTo } from "../../util/math";

function run(player: Player, profile: Profile, currentTick: number) {
  if (!movementReady(profile, currentTick)) return;
  if (profile.inWater || profile.swimming) {
    profile.speedStreak = 0;
    return;
  }

  let limit = profile.sprinting ? movementTuning.sprintSpeed : movementTuning.walkSpeed;
  limit *= 1 + movementTuning.speedEffectBonus * profile.speedAmplifier;
  if (!profile.onGround || profile.groundTicks < 4) {
    limit = Math.max(limit, movementTuning.momentumSpeed);
  }

  if (profile.horizontalSpeed <= limit) {
    if (profile.speedStreak > 0) profile.speedStreak--;
    return;
  }

  if (profile.horizontalSpeed <= movementTuning.iceSpeed && standingOnSlippery(player, profile)) {
    profile.speedStreak = 0;
    return;
  }

  profile.speedStreak++;
  if (profile.speedStreak >= movementTuning.speedStreakNeeded) {
    profile.speedStreak = 0;
    flag(player, profile, "speed", "moved " + roundTo(profile.horizontalSpeed, 3) + " over " + roundTo(limit, 3));
  }
}

registerTick({ id: "speed", interval: 1, heavy: false, run });
