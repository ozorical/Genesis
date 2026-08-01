import { Player, system, world } from "@minecraft/server";
import { movementTuning } from "../config/tuning";
import { dropProfile, profileOf } from "../core/profile";

const spawnGrace = 60;
const dimensionGrace = 80;
const damageGrace = 8;
const itemUseWindow = 12;

export function registerStateEvents() {
  world.afterEvents.entityHurt.subscribe((event) => {
    const hurt = event.hurtEntity;
    if (!(hurt instanceof Player)) return;
    const profile = profileOf(hurt);
    const currentTick = system.currentTick;
    profile.grace(currentTick, damageGrace);
    if (event.damageSource.damagingEntity !== undefined) {
      profile.knockbackUntil = currentTick + movementTuning.knockbackWindow;
      profile.knockbackMoved = false;
    }
  });

  world.afterEvents.playerDimensionChange.subscribe((event) => {
    const profile = profileOf(event.player);
    profile.grace(system.currentTick, dimensionGrace);
    profile.positioned = false;
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    const profile = profileOf(event.player);
    profile.grace(system.currentTick, spawnGrace);
    profile.clearMovementStreaks();
    profile.positioned = false;
  });

  world.afterEvents.itemStartUse.subscribe((event) => {
    if (!(event.source instanceof Player)) return;
    profileOf(event.source).itemUseUntil = system.currentTick + itemUseWindow;
  });

  world.afterEvents.itemStopUse.subscribe((event) => {
    if (!(event.source instanceof Player)) return;
    profileOf(event.source).itemUseUntil = 0;
  });

  world.afterEvents.itemReleaseUse.subscribe((event) => {
    if (!(event.source instanceof Player)) return;
    const profile = profileOf(event.source);
    profile.itemUseUntil = 0;
    if (event.itemStack?.typeId === "minecraft:trident") profile.grace(system.currentTick, 60);
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    dropProfile(event.playerId);
  });

  world.afterEvents.entityRemove.subscribe((event) => {
    if (event.typeId === "minecraft:player") dropProfile(event.removedEntityId);
  });
}
