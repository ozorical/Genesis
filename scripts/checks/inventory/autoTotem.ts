import { EquipmentSlot, Player } from "@minecraft/server";
import { inventoryTuning } from "../../config/tuning";
import { Profile } from "../../core/profile";
import { registerTick } from "../../core/registry";
import { flag } from "../../core/violations";

const totemId = "minecraft:totem_of_undying";

function run(player: Player, profile: Profile, currentTick: number) {
  const equipment = profile.equipmentOf(player);
  if (equipment === undefined) return;

  const holding = equipment.getEquipment(EquipmentSlot.Offhand)?.typeId === totemId;

  if (holding && !profile.hadTotem) {
    const gap = currentTick - profile.totemLostTick;
    if (gap <= inventoryTuning.totemSwapTicks) {
      flag(player, profile, "autoTotem", "replaced a totem " + gap + " ticks after it popped");
    }
  } else if (!holding && profile.hadTotem) {
    profile.totemLostTick = currentTick;
  }

  profile.hadTotem = holding;
}

registerTick({ id: "autoTotem", interval: 2, heavy: false, run });
