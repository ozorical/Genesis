import { ItemStack, Player, system, world } from "@minecraft/server";
import { registerEventChecks } from "./checks";
import { registerCommands } from "./commands";
import { motto, version } from "./config/version";
import { findBan } from "./core/bans";
import { startLoop } from "./core/loop";
import { alertTag, isFrozen, isStaff } from "./core/permissions";
import { profileOf } from "./core/profile";
import { freezePlayer, kickPlayer } from "./core/punish";
import { loadSettings, saveGeneral, settings } from "./core/settings";
import { loadStorage } from "./core/storage";
import { registerStateEvents } from "./events/state";
import { openPanel } from "./ui/panel";
import { prefix } from "./util/format";

const panelItem = "genesis:panel";

system.beforeEvents.startup.subscribe((event) => {
  registerCommands(event.customCommandRegistry);

  event.itemComponentRegistry.registerCustomComponent("genesis:open_panel", {
    onUse: (source) => {
      const player = source.source;
      if (!(player instanceof Player)) return;
      if (!isStaff(player)) {
        player.sendMessage(prefix + "Only staff can open this panel");
        return;
      }
      system.run(() => void openPanel(player));
    },
  });
});

world.afterEvents.worldLoad.subscribe(() => {
  loadStorage();
  loadSettings();
  registerStateEvents();
  registerEventChecks();
  registerJoinHandling();
  startLoop();
  console.log("Genesis " + version + " ready. " + motto);
});

function registerJoinHandling() {
  world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) return;
    const player = event.player;

    const ban = findBan(player.name);
    if (ban !== undefined) {
      kickPlayer(player, ban.reason);
      return;
    }

    if (isFrozen(player)) freezePlayer(player);
    if (!isStaff(player)) return;

    if (!player.hasTag(alertTag)) player.addTag(alertTag);
    player.sendMessage(prefix + "Genesis " + version + " is watching this world");

    if (!settings.setupComplete) {
      settings.setupComplete = true;
      saveGeneral();
      givePanelItem(player);
      player.sendMessage(prefix + "You were handed the Genesis Panel. Hold it and use it to configure everything");
    }
  });
}

function givePanelItem(player: Player) {
  const container = profileOf(player).inventoryOf(player)?.container;
  if (container === undefined) return;

  for (let slot = 0; slot < container.size; slot++) {
    if (container.getItem(slot)?.typeId === panelItem) return;
  }
  container.addItem(new ItemStack(panelItem, 1));
}
