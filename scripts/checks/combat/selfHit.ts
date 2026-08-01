import { Player, world } from "@minecraft/server";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";

export function registerSelfHit() {
  world.afterEvents.entityHitEntity.subscribe((event) => {
    const attacker = event.damagingEntity;
    if (!(attacker instanceof Player)) return;
    if (event.hitEntity.id !== attacker.id) return;
    if (isExempt(attacker)) return;

    flag(attacker, profileOf(attacker), "selfHit", "registered itself as the attacker");
  });
}
