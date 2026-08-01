import { Block, Player, world } from "@minecraft/server";
import { worldTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { blockCenter } from "../../util/blocks";
import { distance, roundTo } from "../../util/math";

export function registerBlockReach() {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    measure(event.player, event.block, "broke");
  });

  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    measure(event.player, event.block, "placed");
  });

  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    measure(event.player, event.block, "reached");
  });
}

function measure(player: Player, block: Block, action: string) {
  if (isExempt(player)) return;

  const range = distance(player.getHeadLocation(), blockCenter(block));
  if (range <= worldTuning.maxBlockDistance) return;

  flag(player, profileOf(player), "blockReach", action + " a block " + roundTo(range, 2) + " blocks away");
}
