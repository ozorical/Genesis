import { system, world } from "@minecraft/server";
import { isExempt } from "./permissions";
import { profileOf } from "./profile";
import { activeTickChecks, resolveStates } from "./registry";
import { sampleProfile } from "./snapshot";
import { settings } from "./settings";

let ticksPerSecond = 20;
let averageCost = 0;
let peakCost = 0;
let shedding = false;
let lastSample = Date.now();
let playersSeen = 0;

export function startLoop() {
  resolveStates();
  system.runInterval(runTick, 1);
  system.runInterval(measureRate, 20);
}

function runTick() {
  const started = Date.now();
  const currentTick = system.currentTick;
  const players = world.getAllPlayers();
  const checks = activeTickChecks();
  playersSeen = players.length;

  for (const player of players) {
    const profile = profileOf(player);
    profile.name = player.name;
    sampleProfile(player, profile, currentTick);
    if (isExempt(player)) continue;

    for (const check of checks) {
      const state = check.state;
      if (state === undefined || !state.enabled) continue;
      if (shedding && check.heavy) continue;
      if (check.interval > 1 && (currentTick + check.offset) % check.interval !== 0) continue;
      check.run(player, profile, currentTick);
    }
  }

  const elapsed = Date.now() - started;
  averageCost = averageCost * 0.92 + elapsed * 0.08;
  if (elapsed > peakCost) peakCost = elapsed;
}

function measureRate() {
  const now = Date.now();
  const delta = now - lastSample;
  lastSample = now;
  if (delta > 0) ticksPerSecond = Math.min(20, 20000 / delta);

  const stressed = settings.loadGuard && ticksPerSecond < settings.minTicksPerSecond;
  if (stressed && !shedding) grantGlobalGrace(60);
  shedding = stressed;
}

function grantGlobalGrace(ticks: number) {
  const currentTick = system.currentTick;
  for (const player of world.getAllPlayers()) {
    profileOf(player).grace(currentTick, ticks);
  }
}

export function performanceStats() {
  return {
    ticksPerSecond: Math.round(ticksPerSecond * 10) / 10,
    averageCost: Math.round(averageCost * 100) / 100,
    peakCost,
    shedding,
    players: playersSeen,
    checks: activeTickChecks().length,
  };
}

export function resetPeak() {
  peakCost = 0;
}
