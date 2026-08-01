import { Player, world } from "@minecraft/server";
import { combatTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { distanceToBox, roundTo } from "../../util/math";

export function registerReach() {
  world.afterEvents.entityHitEntity.subscribe((event) => {
    const attacker = event.damagingEntity;
    const target = event.hitEntity;
    if (!(attacker instanceof Player) || !(target instanceof Player)) return;
    if (isExempt(attacker)) return;

    const profile = profileOf(attacker);
    const reach = distanceToBox(attacker.getHeadLocation(), target.location, 0.6, 1.8);
    if (reach <= combatTuning.maxAttackDistance) return;

    flag(attacker, profile, "reach", "hit " + target.name + " from " + roundTo(reach, 2) + " blocks");
  });
}
