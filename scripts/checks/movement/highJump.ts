import { Player } from "@minecraft/server";
import { movementTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { movementReady } from "../../core/snapshot";
import { flag } from "../../core/violations";
import { roundTo } from "../../util/math";

function run(player: Player, profile: Profile, currentTick: number) {
  if (!movementReady(profile, currentTick)) return;
  if (profile.onGround || profile.inWater || profile.swimming) return;
  if (profile.airTicks > 20) return;

  const gained = profile.jumpPeak - profile.takeoffHeight;
  const allowed = movementTuning.baseJumpHeight + movementTuning.jumpBoostHeight * profile.jumpAmplifier;
  if (gained <= allowed) return;

  profile.takeoffHeight = profile.position.y;
  profile.jumpPeak = profile.position.y;
  flag(player, profile, "highJump", "rose " + roundTo(gained, 2) + " blocks in one jump");
}

registerTick({ id: "highJump", interval: 1, heavy: false, run });
