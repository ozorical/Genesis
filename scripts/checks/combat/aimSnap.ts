import { Player, world } from "@minecraft/server";
import { combatTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { angleDifference, viewAngleTo } from "../../util/math";

export function registerAimSnap() {
  world.afterEvents.entityHitEntity.subscribe((event) => {
    const attacker = event.damagingEntity;
    if (!(attacker instanceof Player)) return;
    if (isExempt(attacker)) return;

    const profile = profileOf(attacker);
    const yawShift = angleDifference(profile.rotation.y, profile.previousRotation.y);
    const pitchShift = Math.abs(profile.rotation.x - profile.previousRotation.x);
    if (yawShift < combatTuning.aimSnapDegrees && pitchShift < combatTuning.aimSnapPitchDegrees) return;

    const landed = viewAngleTo(attacker.getHeadLocation(), event.hitEntity.location, profile.rotation.y);
    if (landed > 20) return;

    flag(attacker, profile, "aimSnap", "turned " + Math.round(yawShift) + " degrees onto the target in one tick");
  });
}
