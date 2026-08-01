import "./movement/fly";
import "./movement/speed";
import "./movement/noClip";
import "./movement/highJump";
import "./movement/noSlow";
import "./movement/antiKnockback";
import "./inventory/autoTotem";
import "./exploit/gameMode";
import "./exploit/badPackets";

import { registerAimSnap } from "./combat/aimSnap";
import { registerAutoClicker } from "./combat/autoClicker";
import { registerKillAura } from "./combat/killAura";
import { registerReach } from "./combat/reach";
import { registerSelfHit } from "./combat/selfHit";
import { registerGameMode } from "./exploit/gameMode";
import { registerNameSpoof } from "./exploit/nameSpoof";
import { registerChestAura } from "./inventory/chestAura";
import { registerIllegalItems } from "./inventory/illegalItems";
import { registerBlockReach } from "./world/blockReach";
import { registerFastBreak } from "./world/fastBreak";
import { registerNuker } from "./world/nuker";
import { registerScaffold } from "./world/scaffold";
import { registerXray } from "./world/xray";

export function registerEventChecks() {
  registerReach();
  registerKillAura();
  registerAutoClicker();
  registerAimSnap();
  registerSelfHit();
  registerNuker();
  registerFastBreak();
  registerBlockReach();
  registerScaffold();
  registerXray();
  registerIllegalItems();
  registerChestAura();
  registerNameSpoof();
  registerGameMode();
}
