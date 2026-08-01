import { GameMode, ItemStack, Player, system, world } from "@minecraft/server";
import { blockHardness, toolSpeeds, worldTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { roundTo } from "../../util/math";

export function registerFastBreak() {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    if (isExempt(player)) return;
    if (player.getGameMode() === GameMode.Creative) return;

    const hardness = blockHardness[event.brokenBlockPermutation.type.id];
    if (hardness === undefined) return;

    const profile = profileOf(player);
    const gap = system.currentTick - profile.lastMineTick;
    profile.lastMineTick = system.currentTick;
    if (gap > 200 || gap < 0) return;

    const required = requiredTicks(player, hardness, event.itemStackBeforeBreak);
    if (gap >= required * worldTuning.breakSpeedTolerance) return;

    flag(player, profile, "fastBreak", "mined in " + gap + " ticks, needs " + roundTo(required, 1));
  });
}

function requiredTicks(player: Player, hardness: number, tool?: ItemStack) {
  let speed = 1;
  if (tool !== undefined) {
    for (const material of Object.keys(toolSpeeds)) {
      if (tool.typeId.indexOf(material) !== -1) {
        speed = toolSpeeds[material];
        break;
      }
    }
    speed += efficiencyBonus(tool);
  }

  const haste = player.getEffect("haste");
  if (haste !== undefined) speed *= Math.pow(1.2, haste.amplifier + 1);

  const seconds = (hardness * 1.5) / speed;
  return Math.max(1, seconds * 20);
}

function efficiencyBonus(tool: ItemStack) {
  const enchantable = tool.getComponent("enchantable");
  if (enchantable === undefined) return 0;
  const efficiency = enchantable.getEnchantment("efficiency");
  if (efficiency === undefined) return 0;
  return efficiency.level * efficiency.level + 1;
}
