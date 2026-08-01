import { system, world } from "@minecraft/server";
import { worldTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { distance, roundTo } from "../../util/math";

export function registerNuker() {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    if (isExempt(player)) return;

    const profile = profileOf(player);
    const currentTick = system.currentTick;
    const position = { x: event.block.x, y: event.block.y, z: event.block.z };

    if (currentTick === profile.lastBreakTick) {
      profile.sameTickBreaks++;
      const broken = profile.sameTickBreaks + 1;
      if (profile.sameTickBreaks >= 2) {
        profile.sameTickBreaks = 0;
        flag(player, profile, "nuker", "broke " + broken + " blocks in a single tick");
      }
    } else {
      const gap = currentTick - profile.lastBreakTick;
      profile.sameTickBreaks = 0;
      if (gap <= worldTuning.nukerWindow) {
        const spread = distance(position, profile.lastBreakPosition);
        if (spread > worldTuning.nukerSpread) {
          flag(player, profile, "nuker", "broke blocks " + roundTo(spread, 1) + " apart in " + gap + " ticks");
        }
      }
    }

    profile.lastBreakTick = currentTick;
    profile.lastBreakPosition = position;
  });
}
