import { Player } from "@minecraft/server";
import { movementTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { movementReady } from "../../core/snapshot";
import { flag } from "../../core/violations";
import { blockAt, blockingMovement } from "../../util/blocks";

function run(player: Player, profile: Profile, currentTick: number) {
  if (!movementReady(profile, currentTick)) return;
  if (profile.horizontalSpeed < 0.05) {
    profile.noClipStreak = 0;
    return;
  }

  const chest = blockAt(player.dimension, {
    x: profile.position.x,
    y: profile.position.y + 1,
    z: profile.position.z,
  });

  if (!blockingMovement(chest)) {
    profile.noClipStreak = 0;
    return;
  }

  profile.noClipStreak++;
  if (profile.noClipStreak >= movementTuning.noClipStreakNeeded) {
    profile.noClipStreak = 0;
    flag(player, profile, "noClip", "inside " + chest!.typeId.replace("minecraft:", ""));
  }
}

registerTick({ id: "noClip", interval: 4, heavy: true, run });
