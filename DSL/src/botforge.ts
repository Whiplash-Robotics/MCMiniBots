import { Bot, BotOptions } from "mineflayer";
import { logErr } from "./utils/error.js";
import mineflayer from "mineflayer";
import { Entity } from "prismarine-entity";
import _ from "lodash";
import { TrackedPlayer } from "./types.js";
import { SensoryModule } from "./modules/SensoryModule.js";
import { SoundModule, SoundEvent } from "./modules/SoundModule.js";
import { PVPModule } from "./modules/PVPModule.js";
import { MovementModule } from "./modules/MovementModule.js";

export interface BotForgeOptions extends BotOptions {
  sensory?: {
    viewDistance?: number;
    fovDegrees?: number;
  };
  sound?: {
    maxSoundAge?: number;
    fuzzyAngle?: number;
  };
}

/**
 * Extends the base Mineflayer Bot type with custom sensory methods.
 * This is what the createBotForge function will return.
 */
// BotForge.ts

export interface BotForge {
  readonly username: string;
  readonly entity: Entity;

  heldItem: Bot["heldItem"];
  quickBarSlot: Bot["quickBarSlot"];
  on: Bot["on"];
  once: Bot["once"];
  setQuickBarSlot: Bot["setQuickBarSlot"];
  setControlState: Bot["setControlState"];
  lookAt: Bot["lookAt"];
  activateItem: Bot["activateItem"];
  deactivateItem: Bot["deactivateItem"];

  attack: (targetUUID: string) => void;
  chat: (message: string) => void;
  // Add other essentials like bot.look, bot.setControlState, etc.

  moveForward: (duration: number) => void;
  moveBackward: (duration: number) => void;
  moveLeft: (duration: number) => void;
  moveRight: (duration: number) => void;
  jump: (duration: number) => void;
  sneak: (duration: number) => void;
  sprint: (duration: number) => void;

  // --- Our Custom Addons ---
  getTrackedPlayers(): TrackedPlayer[];
  findNearestEnemy(): TrackedPlayer | null;
  getRecentSounds(): SoundEvent[];

  readonly strongAttackCharged: boolean;
  readonly damageMultiplier: number;
  readonly inCritWindow: boolean;
}

/**
 * Creates a new BotForge instance.
 * This function creates a standard mineflayer bot and then "upgrades" it
 * with the sensory perception capabilities.
 *
 * @param options - Configuration for the bot, including sensory options.
 * @returns An initialized BotForge instance.
 */
// BotForge.ts

export function createBotForge(options: BotForgeOptions): BotForge {
  const { sensory, sound, ...botOptions } = options;
  const bot = mineflayer.createBot(botOptions);
  const sensoryModule = new SensoryModule(bot, sensory);
  const soundModule = new SoundModule(bot, sound);
  const pvpModule = new PVPModule(bot);
  const movementModule = new MovementModule(bot);

  const WALKING_SPEED = 4.317;

  bot.on("spawn", () => {
    const originalActivateItem = bot.activateItem.bind(bot);
    const speed = 0.5;

    bot.activateItem = (offhand?: boolean) => {
      bot.setControlState("sprint", false);
      originalActivateItem(offhand);
    };
  });
  (bot as any).getTrackedPlayers = sensoryModule.getTrackedPlayers;
  (bot as any).findNearestEnemy = sensoryModule.findNearestEnemy;
  (bot as any).getRecentSounds = soundModule.getRecentSounds;
  (bot as any).moveForward = movementModule.moveForward;
  (bot as any).moveBackward = movementModule.moveBackward;
  (bot as any).moveLeft = movementModule.moveLeft;
  (bot as any).moveRight = movementModule.moveRight;
  (bot as any).jump = movementModule.jump;
  (bot as any).sneak = movementModule.sneak;
  (bot as any).sprint = movementModule.sprint;

  // Getters must be defined using Object.defineProperty
  Object.defineProperty(bot, "strongAttackCharged", {
    get: () => pvpModule.strongAttackCharged,
    enumerable: true, // This allows the property to be iterated over
  });

  Object.defineProperty(bot, "damageMultiplier", {
    get: () => pvpModule.damageMultiplier,
    enumerable: true,
  });

  Object.defineProperty(bot, "inCritWindow", {
    get: () => pvpModule.inCritWindow,
    enumerable: true,
  });

  const allowedProperties = new Set<string | symbol>([
    // Essential read-only properties
    "username",
    "entity",
    "heldItem",
    "quickBarSlot",

    // Essential event listeners
    "on",
    "once",

    // Essential actions
    "chat",
    "look",
    "attack",
    "setQuickBarSlot",
    "setControlState",
    "activateItem",
    "deactivateItem",
    "lookAt",

    // Essential movement methods
    "moveForward",
    "moveBackward",
    "moveLeft",
    "moveRight",
    "jump",
    "sneak",
    "sprint",
    // ^ other crucial methods your bot will need to function.

    // Our custom functions
    "getTrackedPlayers",
    "findNearestEnemy",
    "getRecentSounds",
    "strongAttackCharged",
    "damageMultiplier",
    "inCritWindow",
  ]);
  // 3. Create the Proxy Handler
  const handler: ProxyHandler<Bot> = {
    get(target, prop, receiver) {
      if (allowedProperties.has(prop)) {
        const value = Reflect.get(target, prop, receiver);

        // If the property is a function, bind it to the original bot object.
        // This ensures its internal 'this' refers to the real bot,
        // allowing it to access private properties like '_events' without being trapped.
        if (typeof value === "function") {
          return value.bind(target);
        }

        // Otherwise, just return the value (e.g., for 'username' or 'entity')
        return value;
      }

      logErr(prop);
      return undefined;
    },

    set(target, prop, value, receiver) {
      // Forward the set operation to the original object. This is safer
      // than blocking everything, as it allows allowed methods to
      // manage the bot's internal state correctly.
      return Reflect.set(target, prop, value, receiver);
    },
  };

  return new Proxy(bot, handler) as unknown as BotForge;
}
