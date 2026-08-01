import { EntityEquippableComponent, EntityInventoryComponent, Player, Vector2, Vector3 } from "@minecraft/server";

export interface ViolationRecord {
  count: number;
  lastTick: number;
}

const originVector: Vector3 = { x: 0, y: 0, z: 0 };
const originRotation: Vector2 = { x: 0, y: 0 };

export class Profile {
  readonly id: string;
  name: string;

  position: Vector3 = originVector;
  previousPosition: Vector3 = originVector;
  safePosition: Vector3 = originVector;
  positioned = false;
  velocity: Vector3 = originVector;
  previousVelocity: Vector3 = originVector;
  rotation: Vector2 = originRotation;
  previousRotation: Vector2 = originRotation;

  horizontalSpeed = 0;
  onGround = true;
  wasOnGround = true;
  airTicks = 0;
  groundTicks = 0;
  takeoffHeight = 0;
  sprinting = false;
  sneaking = false;
  gliding = false;
  swimming = false;
  inWater = false;
  climbing = false;
  flying = false;
  riding = false;
  speedAmplifier = 0;
  jumpAmplifier = 0;
  levitating = false;
  slowFalling = false;

  ascendStreak = 0;
  hoverStreak = 0;
  glideStreak = 0;
  speedStreak = 0;
  noClipStreak = 0;
  jumpPeak = 0;

  graceUntil = 0;
  knockbackUntil = 0;
  knockbackMoved = true;
  itemUseUntil = 0;

  clickTimes: number[] = [];
  attackTargets: string[] = [];
  attackWindowStart = 0;
  lastAttackTick = 0;

  lastBreakTick = -100;
  lastBreakPosition: Vector3 = originVector;
  sameTickBreaks = 0;
  lastMineTick = -100;
  oresMined = 0;
  stoneMined = 0;
  oreWindowStart = 0;

  containerTimes: number[] = [];
  nextInventoryScan = 0;
  hadTotem = false;
  totemLostTick = 0;

  lastMessageTime = 0;
  lastMessageText = "";

  violations = new Map<string, ViolationRecord>();
  totalFlags = 0;
  lastAlertTick = 0;

  private inventoryComponent?: EntityInventoryComponent;
  private equippableComponent?: EntityEquippableComponent;

  constructor(player: Player) {
    this.id = player.id;
    this.name = player.name;
  }

  inventoryOf(player: Player) {
    if (!this.inventoryComponent?.isValid) {
      this.inventoryComponent = player.getComponent("inventory");
    }
    return this.inventoryComponent;
  }

  equipmentOf(player: Player) {
    if (!this.equippableComponent?.isValid) {
      this.equippableComponent = player.getComponent("equippable");
    }
    return this.equippableComponent;
  }

  grace(currentTick: number, ticks: number) {
    const until = currentTick + ticks;
    if (until > this.graceUntil) this.graceUntil = until;
  }

  inGrace(currentTick: number) {
    return currentTick < this.graceUntil;
  }

  clearMovementStreaks() {
    this.ascendStreak = 0;
    this.hoverStreak = 0;
    this.glideStreak = 0;
    this.speedStreak = 0;
    this.noClipStreak = 0;
  }
}

const profiles = new Map<string, Profile>();

export function profileOf(player: Player) {
  let profile = profiles.get(player.id);
  if (profile === undefined) {
    profile = new Profile(player);
    profiles.set(player.id, profile);
  }
  return profile;
}

export function findProfile(playerId: string) {
  return profiles.get(playerId);
}

export function dropProfile(playerId: string) {
  profiles.delete(playerId);
}

export function allProfiles() {
  return [...profiles.values()];
}
