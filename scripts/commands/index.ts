import {
  CommandPermissionLevel,
  CustomCommandOrigin,
  CustomCommandParamType,
  CustomCommandRegistry,
  CustomCommandResult,
  CustomCommandStatus,
  Player,
  system,
} from "@minecraft/server";
import { checkDefinitions } from "../config/checks";
import { version } from "../config/version";
import { removeBan } from "../core/bans";
import { performanceStats } from "../core/loop";
import { alertTag, bypassTag, isFrozen, staffTag } from "../core/permissions";
import { profileOf } from "../core/profile";
import { banPlayer, freezePlayer, kickPlayer, unfreezePlayer } from "../core/punish";
import { settings } from "../core/settings";
import { clearViolations, violationSummary } from "../core/violations";
import { prefix } from "../util/format";
import { openPanel } from "../ui/panel";

interface CommandSpec {
  name: string;
  description: string;
  operatorOnly: boolean;
  required?: [string, CustomCommandParamType][];
  optional?: [string, CustomCommandParamType][];
  run: (player: Player, args: unknown[]) => string;
}

const specs: CommandSpec[] = [
  {
    name: "panel",
    description: "Open the Genesis control panel",
    operatorOnly: true,
    run: (player) => {
      system.run(() => void openPanel(player));
      return "Opening the panel";
    },
  },
  {
    name: "alerts",
    description: "Toggle Genesis staff alerts for yourself",
    operatorOnly: true,
    run: (player) => {
      const wanted = !player.hasTag(alertTag);
      system.run(() => (wanted ? player.addTag(alertTag) : player.removeTag(alertTag)));
      return wanted ? "Alerts on" : "Alerts off";
    },
  },
  {
    name: "check",
    description: "Show the violations recorded for a player",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    run: (_player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      const rows = violationSummary(profileOf(target));
      if (rows.length === 0) return target.name + " has no active violations";
      return target.name + " " + rows.map((row) => row.label + " " + row.count).join(", ");
    },
  },
  {
    name: "clear",
    description: "Clear the violations recorded for a player",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    run: (_player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      clearViolations(profileOf(target));
      return "Cleared violations for " + target.name;
    },
  },
  {
    name: "freeze",
    description: "Freeze or release a player in place",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    run: (_player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      const release = isFrozen(target);
      system.run(() => (release ? unfreezePlayer(target) : freezePlayer(target)));
      return (release ? "Released " : "Froze ") + target.name;
    },
  },
  {
    name: "kick",
    description: "Remove a player from the world",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    optional: [["reason", CustomCommandParamType.String]],
    run: (player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      const reason = (args[1] as string) ?? "Removed by " + player.name;
      kickPlayer(target, reason);
      return "Kicked " + target.name;
    },
  },
  {
    name: "ban",
    description: "Ban a player using the default ban length",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    optional: [["reason", CustomCommandParamType.String]],
    run: (player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      const reason = (args[1] as string) ?? "Banned by " + player.name;
      system.run(() => banPlayer(target, reason, player.name, settings.banDays));
      return "Banned " + target.name;
    },
  },
  {
    name: "unban",
    description: "Lift the ban on a name",
    operatorOnly: true,
    required: [["name", CustomCommandParamType.String]],
    run: (_player, args) => {
      const name = (args[0] as string).trim();
      return removeBan(name) ? "Lifted the ban on " + name : "No ban found for " + name;
    },
  },
  {
    name: "bypass",
    description: "Toggle detection bypass for a player",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    run: (_player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      const wanted = !target.hasTag(bypassTag);
      system.run(() => (wanted ? target.addTag(bypassTag) : target.removeTag(bypassTag)));
      return (wanted ? "Granted bypass to " : "Removed bypass from ") + target.name;
    },
  },
  {
    name: "staff",
    description: "Toggle the Genesis staff mark for a player",
    operatorOnly: true,
    required: [["target", CustomCommandParamType.PlayerSelector]],
    run: (_player, args) => {
      const target = firstPlayer(args[0]);
      if (target === undefined) return "No player matched";
      const wanted = !target.hasTag(staffTag);
      system.run(() => (wanted ? target.addTag(staffTag) : target.removeTag(staffTag)));
      return (wanted ? "Marked " : "Unmarked ") + target.name + " as staff";
    },
  },
  {
    name: "stats",
    description: "Report the Genesis performance numbers",
    operatorOnly: true,
    run: () => {
      const stats = performanceStats();
      return stats.ticksPerSecond + " tps, " + stats.averageCost + " ms average, " + stats.players + " players, " + stats.checks + " tick checks";
    },
  },
  {
    name: "about",
    description: "Show the Genesis version and detection count",
    operatorOnly: false,
    run: () => "Genesis " + version + " by Ozz, " + checkDefinitions.length + " detections",
  },
];

export function registerCommands(registry: CustomCommandRegistry) {
  for (const spec of specs) {
    registry.registerCommand(
      {
        name: "genesis:" + spec.name,
        description: spec.description,
        permissionLevel: spec.operatorOnly ? CommandPermissionLevel.GameDirectors : CommandPermissionLevel.Any,
        cheatsRequired: false,
        mandatoryParameters: spec.required?.map(([name, type]) => ({ name, type })),
        optionalParameters: spec.optional?.map(([name, type]) => ({ name, type })),
      },
      (origin: CustomCommandOrigin, ...args: unknown[]): CustomCommandResult => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) {
          return { status: CustomCommandStatus.Failure, message: "Genesis commands need a player" };
        }
        try {
          return { status: CustomCommandStatus.Success, message: prefix + spec.run(player, args) };
        } catch (error) {
          return { status: CustomCommandStatus.Failure, message: prefix + "That command failed: " + (error as Error).message };
        }
      }
    );
  }
}

function firstPlayer(value: unknown) {
  const list = value as Player[] | undefined;
  return list !== undefined && list.length > 0 ? list[0] : undefined;
}
