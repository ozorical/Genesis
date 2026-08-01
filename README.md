# Genesis

**The First Lightweight MCBE Anticheat built for Realms. Lightweight, and reliable.**

Genesis is a Minecraft Bedrock anticheat written for one job: protecting a Realm without spending the Realm's budget. Every other Bedrock anticheat was written for a dedicated server and then squeezed onto Realms afterwards. Genesis was built the other way around. It assumes eleven players, a fixed CPU slice, and an owner who wants to upload one file and be done.

That constraint is the whole design. There is a single tick loop, one sample per player per tick, a scheduler that spreads work across ticks, and a load guard that sheds expensive checks the moment the world starts to struggle. Twenty two detections run inside that budget.

Genesis targets the **stable** scripting API. Your Realm does not need Beta APIs, Education Edition, or any experimental toggle. Upload the pack, restart, done.

---

## Contents

- [Why Genesis](#why-genesis)
- [Requirements](#requirements)
- [Install on a Realm](#install-on-a-realm)
- [Install on a local world](#install-on-a-local-world)
- [First run](#first-run)
- [The panel](#the-panel)
- [Commands](#commands)
- [Detections](#detections)
- [Configuration](#configuration)
- [Staff, bypass, and freezing](#staff-bypass-and-freezing)
- [Bans](#bans)
- [Tuning and false positives](#tuning-and-false-positives)
- [Building from source](#building-from-source)
- [Project layout](#project-layout)
- [Credits](#credits)

---

## Why Genesis

**One upload.** Genesis is a behavior pack and nothing else. There is no resource pack to keep in sync, no second file, no version mismatch to debug. Every icon in every menu is a vanilla texture that already ships inside the client.

**No experiments.** Genesis is built against `@minecraft/server` 2.8.0 and `@minecraft/server-ui` 2.1.0, both stable. Worlds that enable experimental toggles cannot earn achievements and cannot be safely rolled back. Genesis never asks you to give that up.

**One loop.** Most anticheats register a dozen intervals that all fire on the same tick and fight each other for the frame. Genesis runs exactly one `runInterval`, samples each player once, and hands that single snapshot to every check that needs it. Position, velocity, rotation, and ground state are read once per player per tick, never once per check.

**Work is spread, not stacked.** Each tick check declares how often it needs to run. Cheap checks run every tick. Expensive ones run every second, fourth, or twentieth tick, and each one carries a stagger offset so no two land on the same frame.

**It backs off.** A load guard watches the real tick rate. If the world drops below the configured floor, Genesis stops running the checks marked heavy and grants every player a grace window, so a lag spike never turns into a wave of false flags.

**It is honest about lag.** Teleports, damage, knockback, dimension changes, respawns, and riptide launches all open grace windows. Movement checks refuse to run inside one.

---

## Requirements

- Minecraft Bedrock 1.21.90 or newer
- A Realm, a Bedrock Dedicated Server, or a local world
- Operator permission on that world

Nothing else. No experimental toggles, no companion pack, no external service.

---

## Install on a Realm

1. Download `GenesisAC.mcpack` from the release, or build it yourself with `npm run mcpack`.
2. Open the file. Minecraft launches and imports it into your pack library.
3. In Minecraft, go to your Realm, then **Edit Realm**, then **Settings**, then **Behavior Packs**.
4. Open **My Packs**, find **Genesis Anticheat**, and press **Activate**.
5. Press **Play** and let the Realm restart. Genesis loads on the next world load.
6. Join the Realm as an operator. Genesis greets you and hands you the **Genesis Panel** item.

If the Realm was already running when you activated the pack, close the world and rejoin. Scripts only start on a world load.

## Install on a local world

1. Open `GenesisAC.mcpack` to import it.
2. Create or edit a world, open **Behavior Packs**, and activate **Genesis Anticheat**.
3. Leave every experimental toggle **off**. Genesis does not need any of them.
4. Play the world.

For a dedicated server, copy the `mc/GenesisBP` folder into `behavior_packs/` and add its UUID and version to the world's `world_behavior_packs.json`.

## First run

The first operator to join after Genesis loads gets three things:

- A chat line confirming the version that is running
- Staff alerts switched on for them
- The **Genesis Panel** item placed in their inventory

Hold the panel and use it to open the control panel. If you lose it, any operator can run `/give @s genesis:panel`.

Alerts are per player. Any operator can turn their own alerts on or off with `/genesis:alerts`.

---

## The panel

The panel is the whole configuration surface. Nothing needs to be edited by hand and nothing needs a restart.

**Players.** Every player online, with their live flag count and their staff, frozen, and bypass marks. Open one to read their active violations, review their recent flags, freeze them, grant or remove a bypass, clear their violations, kick them, or ban them.

**Detections.** The twenty two checks, grouped into Combat, Movement, World, Inventory, and Exploit. Open a check to read what it catches, switch it on or off, choose what happens when a player reaches the limit, and set that limit.

**Violation Log.** The most recent flags across the whole world, newest first, with a timestamp, the player, the check, and the specific reading that tripped it. The log holds sixty entries by default and can be cleared.

**Ban List.** Every active ban with its reason, the staff member who issued it, and its expiry. Lift a ban here, or add one for a player who is not currently online.

**Performance.** The live tick rate, the average and peak cost of the Genesis tick in milliseconds, how many players are being sampled, how many tick checks are registered, and whether the load guard is currently shedding work.

**Settings.** The global switches described under [Configuration](#configuration).

**About.** Version, detection count, and author.

---

## Commands

All commands are namespaced `genesis:`. Everything except `/genesis:about` requires operator.

| Command | What it does |
| --- | --- |
| `/genesis:panel` | Opens the control panel |
| `/genesis:alerts` | Turns your own staff alerts on or off |
| `/genesis:check <player>` | Prints that player's active violations |
| `/genesis:clear <player>` | Clears that player's violations |
| `/genesis:freeze <player>` | Freezes or releases a player in place |
| `/genesis:kick <player> [reason]` | Removes a player from the world |
| `/genesis:ban <player> [reason]` | Bans a player using the default ban length |
| `/genesis:unban <name>` | Lifts a ban by exact name |
| `/genesis:bypass <player>` | Toggles detection bypass for a player |
| `/genesis:staff <player>` | Toggles the Genesis staff mark |
| `/genesis:stats` | Prints the live performance numbers |
| `/genesis:about` | Prints the version and detection count |

---

## Detections

Twenty two checks across five groups. The default action is what happens once a player reaches that check's violation limit. Violations decay over time, so a player who trips something once an hour never escalates.

### Combat

| Check | Default | What it catches |
| --- | --- | --- |
| Reach | Set back | Attacks that land from further away than vanilla range allows, measured from the attacker's eyes to the nearest face of the target's hitbox |
| Kill Aura | Set back | Swinging at a target well outside the field of view, hitting three or more separate targets inside twelve ticks, or landing a hit through a solid wall |
| Auto Clicker | Log | Click rates above seventeen per second, and click spacing so even that no hand produced it |
| Aim Snap | Log | A head rotation that jumps onto a target in the same tick the attack lands |
| Self Hit | Set back | A player reporting itself as its own attacker, which no legitimate client does |

### Movement

| Check | Default | What it catches |
| --- | --- | --- |
| Fly | Set back | Climbing while airborne, holding a fixed altitude, or falling far slower than gravity permits |
| Speed | Set back | Ground speed above what sprinting, jump momentum, ice, and the speed effect can produce together |
| No Clip | Set back | Moving while the player's chest occupies a solid block |
| High Jump | Set back | Gaining more height in one jump than the current jump boost level allows |
| No Slow | Log | Keeping full speed while eating, drawing a bow, or sneaking |
| Anti Knockback | Log | Taking a hit from another entity and absorbing the knockback that should have moved the player |

### World

| Check | Default | What it catches |
| --- | --- | --- |
| Nuker | Set back | Two or more blocks broken in a single tick, or consecutive breaks too far apart to be the same mining action |
| Scaffold | Set back | Placing a block below foot level, while moving, with the block well behind the player's view |
| Fast Break | Set back | Breaking a block faster than its hardness allows for the tool actually held, accounting for efficiency and haste |
| Block Reach | Set back | Breaking, placing, or interacting with a block outside interaction range |
| X Ray | Log | An ore to stone ratio underground that a player without vision through rock would not reach |

### Inventory

| Check | Default | What it catches |
| --- | --- | --- |
| Illegal Items | Set back | Banned items, stacks above the item's real maximum, and enchantments above their real maximum level. Offending stacks are removed on sight and on join |
| Auto Totem | Log | A totem returning to the offhand within a handful of ticks of the last one popping |
| Chest Aura | Set back | Four containers opened inside two seconds |

### Exploit

| Check | Default | What it catches |
| --- | --- | --- |
| Name Spoof | Kick | Names carrying formatting codes, control characters, or impossible lengths |
| Game Mode | Set back | A non staff player entering creative or spectator. The switch is cancelled and the player is returned to survival |
| Bad Packets | Set back | Positions that are not numbers, positions outside the world border, and pitch values the client cannot send |

### A note on chat

Chat moderation is deliberately absent. The chat event is not part of the stable scripting API, so shipping a spam check would force every Realm running Genesis to enable Beta APIs. That trade was not worth it. Genesis stays stable and experiment free.

---

## Configuration

Everything below lives under **Settings** in the panel and is saved to the world immediately.

| Setting | Default | Effect |
| --- | --- | --- |
| Staff alerts | On | Master switch for alert messages. Individual staff still opt in with `/genesis:alerts` |
| Automatic punishments | On | When off, checks still flag and log but Genesis never acts on its own |
| Staff bypass detections | On | Operators and players marked staff are skipped by every check |
| Load guard | On | Sheds heavy checks when the tick rate falls below the floor |
| Default ban length | 0 days | Length used by `/genesis:ban` and by any check whose action is Ban. Zero means permanent |
| Violation decay | 45 seconds | How long a quiet period has to last before a player loses a violation |
| Log size | 60 | How many entries the violation log holds |
| Load guard trigger | 15 tps | The tick rate below which the load guard starts shedding |

Per check you can set:

- **Enabled.** Off means the check does no work at all. It is skipped inside the loop, not just silenced.
- **Action at limit.** Log only, Set back, Kick, or Ban.
- **Violations before action.** One to thirty. The counter resets after the action fires, so the ladder repeats.

**Restore Detection Defaults** in Settings puts every check back to the values it shipped with.

---

## Staff, bypass, and freezing

Genesis recognises staff two ways. Anyone with operator permission is staff automatically. Anyone carrying the `genesis:staff` tag is staff as well, which lets you trust a moderator without handing them operator. Use `/genesis:staff <player>` or the panel to toggle it.

While **Staff bypass detections** is on, staff are skipped entirely. Turn it off if you want to be watched like everyone else.

A bypass is the per player version of the same thing. `/genesis:bypass <player>` adds the `genesis:bypass` tag, and a tagged player is skipped by every check regardless of the staff setting. Use it for a builder in creative or a player you are actively testing against.

Freezing locks a player's movement and camera so they cannot leave while you look into something. It survives a rejoin, so a frozen player who disconnects comes back still frozen. `/genesis:freeze <player>` toggles it.

## Bans

Bans are stored on the world itself, so they survive restarts and do not need an external database. A ban records the name, the reason, the staff member who issued it, and an expiry. Zero days means permanent. Expired bans are cleared automatically the first time they are looked up.

Enforcement happens on join. A banned player is removed the moment they spawn in.

Bans are keyed by name, not by account. That is a deliberate Realms trade off: the scripting API cannot see a player before they spawn, so the name is what Genesis has to work with.

---

## Tuning and false positives

Genesis ships tuned for survival play at Realm latency, and every threshold has slack in it. If something still trips wrongly, work through this in order.

1. **Read the log.** Every flag records the actual reading that caused it. `Speed: moved 0.34 over 0.29` tells you exactly how far past the limit the player was, and whether the limit is the problem or the player is.
2. **Raise the violation limit before you disable the check.** Going from five to twelve keeps the detection alive and reporting while making it far harder to trip accidentally.
3. **Drop the action to Log only.** The check keeps watching and keeps writing to the log, but stops acting. This is the right first move for any check you are unsure about.
4. **Grant a bypass** to the specific player if the issue is one builder or one tester.
5. **Only then turn the check off.**

Checks most worth watching on a busy Realm:

- **Speed** and **Fly** on worlds with heavy elytra, boat, or trident use. All three are excluded already, but unusual setups can still surprise them.
- **Fast Break** on worlds handing out high efficiency tools alongside beacons.
- **X Ray** in worlds where players mine prepared branch tunnels. It is Log only by default for exactly this reason.
- **Anti Knockback** for players who fight with their back to a wall.

If the tick cost under **Performance** climbs on a full Realm, lower the interval pressure by disabling the checks marked heavy first. Right now that is No Clip, the only check that reads a block every time it runs.

---

## Building from source

```
npm install
npm run build      # typecheck, then bundle to dist/scripts/main.js
npm run package    # build, then assemble mc/GenesisBP
npm run mcpack     # package, then zip dist/packages/GenesisAC.mcpack
npm run typecheck  # typecheck only, fast
npm run lint       # eslint over scripts
npm run clean      # remove lib, dist, and mc
```

The pipeline is three stages. TypeScript in `scripts/` is typechecked, then esbuild bundles it into a single `dist/scripts/main.js`. That bundle is copied alongside the pack sources from `behavior_packs/GenesisBP/` into `mc/GenesisBP/`, which is a complete, loadable behavior pack. Finally `mc/GenesisBP` is zipped into `dist/packages/GenesisAC.mcpack`, the file you upload.

`npm run build:production` style output is available with `npx just-scripts mcpack --production`, which strips the source map and minifies whitespace.

Run `npx just-scripts watch` while developing to rebuild and reassemble on every save.

## Project layout

```
scripts/
  main.ts                 Entry point. Startup registration, world load, join handling
  config/
    checks.ts             Every check definition, its group, default action, and limit
    tuning.ts             Physics constants, thresholds, block tables, banned items
    version.ts            Version, motto, author
  core/
    loop.ts               The single tick loop, the scheduler, the load guard
    snapshot.ts           One sample per player per tick, shared by every check
    profile.ts            Per player state, streaks, grace windows, cached components
    registry.ts           Tick check registration and stagger offsets
    violations.ts         Scoring, decay, and escalation
    punish.ts             Set back, kick, ban, freeze
    bans.ts               Ban records on world storage
    settings.ts           Runtime settings, loading, and saving
    storage.ts            Cached dynamic property access
    permissions.ts        Staff, bypass, and freeze marks
    alerts.ts             Staff alert delivery
    history.ts            The violation log
  checks/
    combat/               reach, killAura, autoClicker, aimSnap, selfHit
    movement/             fly, speed, noClip, highJump, noSlow, antiKnockback
    world/                nuker, scaffold, fastBreak, blockReach, xray
    inventory/            illegalItems, autoTotem, chestAura
    exploit/              nameSpoof, gameMode, badPackets
    index.ts              Imports tick checks, registers event checks
  commands/
    index.ts              Every slash command
  ui/
    panel.ts              The main panel
    checksMenu.ts         Detection groups, checks, and the check editor
    playersMenu.ts        Player list and player actions
    logsMenu.ts           Violation log
    bansMenu.ts           Ban list
    statusMenu.ts         Performance readout
    settingsMenu.ts       Global settings
    aboutMenu.ts          About
    icons.ts              Vanilla texture paths used by every menu
    forms.ts              Form helpers, including the busy retry
  events/
    state.ts              Grace windows, item use, knockback expectation, cleanup
  util/
    math.ts               Distance, angles, hitbox distance, deviation
    blocks.ts             Block lookups and classification
    format.ts             Prefixes, durations, timestamps

behavior_packs/GenesisBP/ Pack sources: manifest, item, language files, icon
tools/mcpack.ts           The zip writer that produces the mcpack
mc/GenesisBP/             Build output. A complete behavior pack, ready to load
dist/                     Build output. Bundle, source map, and packaged mcpack
```

### Adding a check

1. Create the file under the right `scripts/checks/<group>/` folder.
2. For a per tick check, call `registerTick({ id, interval, heavy, run })` at the bottom of the file, then add a side effect import to `scripts/checks/index.ts`.
3. For an event driven check, export a `register<Name>()` that subscribes to what it needs, then call it from `registerEventChecks()` in `scripts/checks/index.ts`.
4. Add the definition to `checkDefinitions` in `scripts/config/checks.ts`. It appears in the panel automatically.
5. Put any numbers it needs in `scripts/config/tuning.ts`, not in the check file.

Call `flag(player, profile, checkId, detail)` to report. Scoring, decay, alerts, logging, and escalation are handled for you. The `detail` string is what a staff member reads in the log, so make it a specific reading, not a restatement of the check name.

---

## Credits

Built by **Ozz**.

Genesis is an original implementation. It was designed after studying how the existing Bedrock anticheats approach detection, but no code was carried over from any of them.

Released under the MIT license.
