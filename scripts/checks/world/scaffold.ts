import { world } from "@minecraft/server";
import { worldTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { blockCenter } from "../../util/blocks";
import { viewAngleTo } from "../../util/math";

export function registerScaffold() {
  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    if (isExempt(player)) return;

    const profile = profileOf(player);
    if (profile.horizontalSpeed < worldTuning.scaffoldMinSpeed) return;
    if (event.block.y >= Math.floor(profile.position.y)) return;

    const angle = viewAngleTo(player.getHeadLocation(), blockCenter(event.block), profile.rotation.y);
    if (angle < worldTuning.scaffoldAngle) return;

    flag(player, profile, "scaffold", "bridged with the block " + Math.round(angle) + " degrees behind");
  });
}
