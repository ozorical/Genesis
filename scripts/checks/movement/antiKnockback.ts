import { Player } from "@minecraft/server";
import { movementTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { flag } from "../../core/violations";
import { roundTo } from "../../util/math";

function run(player: Player, profile: Profile, currentTick: number) {
  if (currentTick > profile.knockbackUntil) return;
  if (profile.riding || profile.gliding || profile.climbing) return;

  if (profile.horizontalSpeed >= movementTuning.knockbackMinimum) {
    profile.knockbackMoved = true;
    return;
  }

  if (currentTick === profile.knockbackUntil && !profile.knockbackMoved) {
    profile.knockbackMoved = true;
    flag(player, profile, "antiKnockback", "took a hit and moved " + roundTo(profile.horizontalSpeed, 3));
  }
}

registerTick({ id: "antiKnockback", interval: 1, heavy: false, run });
