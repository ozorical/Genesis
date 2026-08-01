import { Block, Dimension, LiquidType, Player, Vector3 } from "@minecraft/server";
import { oreBlocks, stoneBlocks } from "../config/tuning";
import { Profile } from "../core/profile";

const slipperyBlocks = [
  "minecraft:ice",
  "minecraft:packed_ice",
  "minecraft:blue_ice",
  "minecraft:frosted_ice",
  "minecraft:slime",
  "minecraft:honey_block",
];

const passThrough = [
  "minecraft:ladder",
  "minecraft:vine",
  "minecraft:scaffolding",
  "minecraft:web",
  "minecraft:cobweb",
  "minecraft:snow_layer",
  "minecraft:powder_snow",
  "minecraft:bamboo",
  "minecraft:sweet_berry_bush",
  "minecraft:cave_vines",
  "minecraft:big_dripleaf",
  "minecraft:small_dripleaf_block",
];

const containerBlocks = [
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:ender_chest",
  "minecraft:barrel",
  "minecraft:shulker_box",
  "minecraft:undyed_shulker_box",
  "minecraft:hopper",
  "minecraft:dispenser",
  "minecraft:dropper",
  "minecraft:furnace",
  "minecraft:lit_furnace",
  "minecraft:blast_furnace",
  "minecraft:lit_blast_furnace",
  "minecraft:smoker",
  "minecraft:lit_smoker",
  "minecraft:brewing_stand",
];

export function blockAt(dimension: Dimension, position: Vector3) {
  try {
    return dimension.getBlock(position);
  } catch {
    return undefined;
  }
}

export function blockCenter(block: Block): Vector3 {
  return { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
}

export function standingOnSlippery(player: Player, profile: Profile) {
  const below = blockAt(player.dimension, {
    x: profile.position.x,
    y: profile.position.y - 0.4,
    z: profile.position.z,
  });
  return below !== undefined && slipperyBlocks.indexOf(below.typeId) !== -1;
}

export function blockingMovement(block: Block | undefined) {
  if (block === undefined) return false;
  if (block.isAir || block.isLiquid) return false;
  if (passThrough.indexOf(block.typeId) !== -1) return false;
  const id = block.typeId;
  if (id.endsWith("_door") || id.endsWith("_trapdoor") || id.endsWith("_sign")) return false;
  if (id.endsWith("_fence_gate") || id.endsWith("_slab") || id.endsWith("_carpet")) return false;
  if (id.endsWith("_button") || id.endsWith("_pressure_plate") || id.endsWith("_banner")) return false;
  return block.isLiquidBlocking(LiquidType.Water);
}

export function isOre(typeId: string) {
  return oreBlocks.indexOf(typeId) !== -1;
}

export function isStone(typeId: string) {
  return stoneBlocks.indexOf(typeId) !== -1;
}

export function isContainer(typeId: string) {
  return containerBlocks.indexOf(typeId) !== -1 || typeId.endsWith("_shulker_box");
}
