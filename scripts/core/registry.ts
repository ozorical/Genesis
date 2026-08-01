import { Player } from "@minecraft/server";
import { Profile } from "./profile";
import { CheckState, checkState } from "./settings";

export interface TickCheck {
  id: string;
  interval: number;
  heavy: boolean;
  run: (player: Player, profile: Profile, currentTick: number) => void;
  offset: number;
  state?: CheckState;
}

export type TickCheckInput = Omit<TickCheck, "offset" | "state">;

const tickChecks: TickCheck[] = [];

export function registerTick(check: TickCheckInput) {
  tickChecks.push({ ...check, offset: tickChecks.length });
}

export function activeTickChecks() {
  return tickChecks;
}

export function resolveStates() {
  for (const check of tickChecks) {
    check.state = checkState(check.id);
  }
}
