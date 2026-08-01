import { ItemStack, Player, system, world } from "@minecraft/server";
import { bannedItems } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";

export function registerIllegalItems() {
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const stack = event.itemStack;
    if (stack === undefined) return;
    const player = event.player;
    if (isExempt(player)) return;

    const reason = faultWith(stack);
    if (reason === undefined) return;

    flag(player, profileOf(player), "illegalItems", reason);
    system.run(() => sweepInventory(player));
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) return;
    if (isExempt(event.player)) return;
    system.run(() => auditOnJoin(event.player));
  });
}

function faultWith(stack: ItemStack) {
  if (bannedItems.indexOf(stack.typeId) !== -1) {
    return "held " + stack.typeId.replace("minecraft:", "");
  }

  if (stack.amount > stack.maxAmount) {
    return "stacked " + stack.typeId.replace("minecraft:", "") + " to " + stack.amount;
  }

  const enchantable = stack.getComponent("enchantable");
  if (enchantable === undefined) return undefined;

  for (const enchantment of enchantable.getEnchantments()) {
    if (enchantment.level > enchantment.type.maxLevel) {
      return enchantment.type.id + " " + enchantment.level + " on " + stack.typeId.replace("minecraft:", "");
    }
  }

  return undefined;
}

function sweepInventory(player: Player) {
  const container = profileOf(player).inventoryOf(player)?.container;
  if (container === undefined) return 0;

  let removed = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined) continue;
    if (faultWith(stack) === undefined) continue;
    container.setItem(slot, undefined);
    removed++;
  }
  return removed;
}

function auditOnJoin(player: Player) {
  const removed = sweepInventory(player);
  if (removed === 0) return;
  flag(player, profileOf(player), "illegalItems", "joined carrying " + removed + " illegal items");
}
