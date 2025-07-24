import { Bot, BotOptions } from "mineflayer";
import { logErr } from "./utils/error.js";
import mineflayer from "mineflayer";
import { Entity } from "prismarine-entity";
import _ from "lodash";
import { TrackedPlayer } from "./types.js";
import { SensoryModule } from "./modules/SensoryModule.js";
import { SoundModule, SoundEvent } from "./modules/SoundModule.js";
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

  on: Bot["on"];
  once: Bot["once"];
  chat: (message: string) => void;
  // Add other essentials like bot.look, bot.setControlState, etc.

  // --- Our Custom Addons ---
  getTrackedPlayers(): TrackedPlayer[];
  findNearestEnemy(): TrackedPlayer | null;
  getRecentSounds(): SoundEvent[];
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

  (bot as any).getTrackedPlayers = sensoryModule.getTrackedPlayers;
  (bot as any).findNearestEnemy = sensoryModule.findNearestEnemy;
  (bot as any).getRecentSounds = soundModule.getRecentSounds;

  const allowedProperties = new Set<string | symbol>([
    // Essential read-only properties
    "username",
    "entity",

    // Essential event listeners
    "on",
    "once",

    // Essential actions
    "chat",
    "look",
    //"setControlState",
    // ^ other crucial methods your bot will need to function.

    // Our custom functions
    "getTrackedPlayers",
    "findNearestEnemy",
    "getRecentSounds",
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
