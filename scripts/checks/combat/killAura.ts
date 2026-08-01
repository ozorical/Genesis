import { Entity, Player, system, world } from "@minecraft/server";
import { combatTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { Profile, profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { distance, roundTo, viewAngleTo } from "../../util/math";

export function registerKillAura() {
  world.afterEvents.entityHitEntity.subscribe((event) => {
    const attacker = event.damagingEntity;
    if (!(attacker instanceof Player)) return;
    if (isExempt(attacker)) return;

    const target = event.hitEntity;
    if (target.id === attacker.id) return;

    const profile = profileOf(attacker);
    const currentTick = system.currentTick;
    const head = attacker.getHeadLocation();

    const angle = viewAngleTo(head, target.location, profile.rotation.y);
    if (angle > combatTuning.maxAttackAngle) {
      flag(attacker, profile, "killAura", "swung " + Math.round(angle) + " degrees away from " + target.typeId.replace("minecraft:", ""));
      return;
    }

    if (trackMultipleTargets(profile, target, currentTick)) {
      flag(attacker, profile, "killAura", "hit " + profile.attackTargets.length + " targets within " + combatTuning.auraTargetWindow + " ticks");
      profile.attackTargets.length = 0;
      return;
    }

    const range = distance(head, target.location);
    if (range > combatTuning.wallCheckMinDistance && blockedByWall(attacker, target, range)) {
      flag(attacker, profile, "killAura", "hit through a wall at " + roundTo(range, 2) + " blocks");
    }
  });
}

function trackMultipleTargets(profile: Profile, target: Entity, currentTick: number) {
  if (currentTick - profile.attackWindowStart > combatTuning.auraTargetWindow) {
    profile.attackWindowStart = currentTick;
    profile.attackTargets.length = 0;
  }
  if (profile.attackTargets.indexOf(target.id) === -1) profile.attackTargets.push(target.id);
  profile.lastAttackTick = currentTick;
  return profile.attackTargets.length >= combatTuning.auraTargetCount;
}

function blockedByWall(attacker: Player, target: Entity, range: number) {
  const head = attacker.getHeadLocation();
  const direction = {
    x: (target.location.x - head.x) / range,
    y: (target.location.y + 0.9 - head.y) / range,
    z: (target.location.z - head.z) / range,
  };

  try {
    const hit = attacker.dimension.getBlockFromRay(head, direction, { maxDistance: range });
    if (hit === undefined) return false;
    return distance(head, hit.block.center()) < range - 0.6;
  } catch {
    return false;
  }
}
