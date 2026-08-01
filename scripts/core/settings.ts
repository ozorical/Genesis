import { CheckAction, CheckDefinition, checkDefinitions } from "../config/checks";
import { readValue, writeValue } from "./storage";

export interface CheckState {
  definition: CheckDefinition;
  enabled: boolean;
  action: CheckAction;
  threshold: number;
}

export interface GeneralSettings {
  alerts: boolean;
  punishments: boolean;
  staffBypass: boolean;
  banDays: number;
  decaySeconds: number;
  logSize: number;
  loadGuard: boolean;
  minTicksPerSecond: number;
  setupComplete: boolean;
}

const states = new Map<string, CheckState>();

export const settings: GeneralSettings = {
  alerts: true,
  punishments: true,
  staffBypass: true,
  banDays: 0,
  decaySeconds: 45,
  logSize: 60,
  loadGuard: true,
  minTicksPerSecond: 15,
  setupComplete: false,
};

const actions: CheckAction[] = ["log", "setback", "kick", "ban"];

export function loadSettings() {
  states.clear();
  for (const definition of checkDefinitions) {
    const stored = readValue("genesis:check:" + definition.id, "");
    const state: CheckState = {
      definition,
      enabled: definition.enabled,
      action: definition.action,
      threshold: definition.threshold,
    };
    if (stored.length > 0) {
      const parts = stored.split(",");
      state.enabled = parts[0] === "1";
      if (actions.indexOf(parts[1] as CheckAction) !== -1) state.action = parts[1] as CheckAction;
      const threshold = Number(parts[2]);
      if (Number.isFinite(threshold) && threshold > 0) state.threshold = threshold;
    }
    states.set(definition.id, state);
  }

  settings.alerts = readValue("genesis:alerts", settings.alerts);
  settings.punishments = readValue("genesis:punishments", settings.punishments);
  settings.staffBypass = readValue("genesis:staffBypass", settings.staffBypass);
  settings.banDays = readValue("genesis:banDays", settings.banDays);
  settings.decaySeconds = readValue("genesis:decaySeconds", settings.decaySeconds);
  settings.logSize = readValue("genesis:logSize", settings.logSize);
  settings.loadGuard = readValue("genesis:loadGuard", settings.loadGuard);
  settings.minTicksPerSecond = readValue("genesis:minTps", settings.minTicksPerSecond);
  settings.setupComplete = readValue("genesis:setup", settings.setupComplete);
}

export function checkState(id: string) {
  return states.get(id);
}

export function allCheckStates() {
  return [...states.values()];
}

export function saveCheckState(state: CheckState) {
  const packed = (state.enabled ? "1" : "0") + "," + state.action + "," + state.threshold;
  writeValue("genesis:check:" + state.definition.id, packed);
}

export function saveGeneral() {
  writeValue("genesis:alerts", settings.alerts);
  writeValue("genesis:punishments", settings.punishments);
  writeValue("genesis:staffBypass", settings.staffBypass);
  writeValue("genesis:banDays", settings.banDays);
  writeValue("genesis:decaySeconds", settings.decaySeconds);
  writeValue("genesis:logSize", settings.logSize);
  writeValue("genesis:loadGuard", settings.loadGuard);
  writeValue("genesis:minTps", settings.minTicksPerSecond);
  writeValue("genesis:setup", settings.setupComplete);
}

export function resetSettings() {
  for (const state of states.values()) {
    state.enabled = state.definition.enabled;
    state.action = state.definition.action;
    state.threshold = state.definition.threshold;
    saveCheckState(state);
  }
}
