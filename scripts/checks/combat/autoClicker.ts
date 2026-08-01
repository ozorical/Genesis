import { EntitySwingSource, world } from "@minecraft/server";
import { combatTuning } from "../../config/tuning";
import { isExempt } from "../../core/permissions";
import { profileOf } from "../../core/profile";
import { flag } from "../../core/violations";
import { roundTo, standardDeviation } from "../../util/math";

export function registerAutoClicker() {
  world.afterEvents.playerSwingStart.subscribe((event) => {
    if (event.swingSource !== EntitySwingSource.Attack) return;
    const player = event.player;
    if (isExempt(player)) return;

    const profile = profileOf(player);
    const now = Date.now();
    profile.clickTimes.push(now);
    while (profile.clickTimes.length > combatTuning.clickSampleSize) profile.clickTimes.shift();

    const clicks = profile.clickTimes;
    if (clicks.length < combatTuning.clickSampleSize) return;

    const span = now - clicks[0];
    if (span <= 0) return;

    const rate = ((clicks.length - 1) * 1000) / span;
    if (rate > combatTuning.maxClicksPerSecond) {
      clicks.length = 0;
      flag(player, profile, "autoClicker", "clicked at " + roundTo(rate, 1) + " per second");
      return;
    }

    const gaps: number[] = [];
    for (let index = 1; index < clicks.length; index++) gaps.push(clicks[index] - clicks[index - 1]);

    if (standardDeviation(gaps) < combatTuning.minClickDeviation) {
      clicks.length = 0;
      flag(player, profile, "autoClicker", "clicked with no timing variance at " + roundTo(rate, 1) + " per second");
    }
  });
}
