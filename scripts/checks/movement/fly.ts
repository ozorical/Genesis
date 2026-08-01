import { Player } from "@minecraft/server";
import { movementTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { movementReady } from "../../core/snapshot";
import { flag } from "../../core/violations";
import { roundTo } from "../../util/math";

function run(player: Player, profile: Profile, currentTick: number) {
  if (!movementReady(profile, currentTick)) return;

  if (profile.onGround || profile.inWater || profile.swimming) {
    profile.ascendStreak = 0;
    profile.hoverStreak = 0;
    profile.glideStreak = 0;
    return;
  }

  if (profile.airTicks < movementTuning.minAirTicks) return;

  const rise = profile.position.y - profile.previousPosition.y;

  if (rise > 0) profile.ascendStreak++;
  else profile.ascendStreak = 0;

  if (Math.abs(rise) < movementTuning.hoverTolerance) profile.hoverStreak++;
  else profile.hoverStreak = 0;

  if (profile.airTicks > movementTuning.glideAirTicks && rise > movementTuning.glideFallRate && !profile.slowFalling) {
    profile.glideStreak++;
  } else {
    profile.glideStreak = 0;
  }

  if (profile.ascendStreak >= movementTuning.ascendStreakNeeded) {
    profile.ascendStreak = 0;
    flag(player, profile, "fly", "climbed " + roundTo(rise, 3) + " per tick");
    return;
  }

  if (profile.hoverStreak >= movementTuning.hoverStreakNeeded) {
    profile.hoverStreak = 0;
    flag(player, profile, "fly", "held altitude for " + profile.airTicks + " ticks");
    return;
  }

  if (profile.glideStreak >= movementTuning.glideStreakNeeded) {
    profile.glideStreak = 0;
    flag(player, profile, "fly", "fell at " + roundTo(rise, 3) + " per tick");
  }
}

registerTick({ id: "fly", interval: 1, heavy: false, run });
