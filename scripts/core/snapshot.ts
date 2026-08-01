import { Player } from "@minecraft/server";
import { horizontalDistance } from "../util/math";
import { Profile } from "./profile";

const effectInterval = 10;

export function sampleProfile(player: Player, profile: Profile, currentTick: number) {
  profile.previousPosition = profile.position;
  profile.position = player.location;
  profile.previousVelocity = profile.velocity;
  profile.velocity = player.getVelocity();
  profile.previousRotation = profile.rotation;
  profile.rotation = player.getRotation();
  profile.horizontalSpeed = horizontalDistance(profile.position, profile.previousPosition);

  profile.wasOnGround = profile.onGround;
  profile.onGround = player.isOnGround;
  profile.sprinting = player.isSprinting;
  profile.sneaking = player.isSneaking;
  profile.gliding = player.isGliding;
  profile.swimming = player.isSwimming;
  profile.inWater = player.isInWater;
  profile.climbing = player.isClimbing;
  profile.flying = player.isFlying;

  if (!profile.positioned) {
    profile.positioned = true;
    profile.safePosition = profile.position;
  }

  if (profile.onGround) {
    profile.groundTicks++;
    profile.airTicks = 0;
    profile.takeoffHeight = profile.position.y;
    profile.jumpPeak = profile.position.y;
    if (!profile.inGrace(currentTick)) profile.safePosition = profile.position;
  } else {
    profile.airTicks++;
    profile.groundTicks = 0;
    if (profile.position.y > profile.jumpPeak) profile.jumpPeak = profile.position.y;
  }

  if (currentTick % effectInterval === 0) sampleEffects(player, profile);
}

function sampleEffects(player: Player, profile: Profile) {
  profile.speedAmplifier = readAmplifier(player, "speed");
  profile.jumpAmplifier = readAmplifier(player, "jump_boost");
  profile.levitating = player.getEffect("levitation") !== undefined;
  profile.slowFalling = player.getEffect("slow_falling") !== undefined;
  profile.riding = player.getComponent("riding")?.entityRidingOn !== undefined;
}

function readAmplifier(player: Player, effect: string) {
  const found = player.getEffect(effect);
  return found === undefined ? 0 : found.amplifier + 1;
}

export function movementReady(profile: Profile, currentTick: number) {
  if (profile.inGrace(currentTick)) return false;
  if (profile.flying || profile.gliding || profile.riding) return false;
  if (profile.levitating || profile.climbing) return false;
  return true;
}
