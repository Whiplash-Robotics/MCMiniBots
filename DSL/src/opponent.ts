import { Bot, BotOptions } from "mineflayer";
import mineflayer from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { Vec3 } from "vec3";
import * as vectorUtils from "../utils/vector.js"; // Assuming these utils exist
import * as botUtils from "../utils/bot.js"; // Assuming these utils exist
import _ from "lodash";

export enum PlayerHealthStatus {
  Healthy = "Healthy", // > 75% HP
  Injured = "Injured", // 25% - 75% HP
  BadlyWounded = "BadlyWounded", // < 25% HP
  Unknown = "Unknown", // Health cannot be determined
}

export interface TrackedPlayer {
  readonly username: string;
  readonly uuid: string;
  readonly position: Vec3 | null;
  readonly velocity: Vec3 | null;
  readonly heldItem: Item | null;
  readonly armor: {
    head: Item | null;
    torso: Item | null;
    legs: Item | null;
    feet: Item | null;
  };
  readonly isCrouching: boolean | null;
  readonly isSprinting: boolean | null;
  readonly isOnFire: boolean | null;
  readonly healthStatus: PlayerHealthStatus;
  readonly isInLineOfSight: boolean;
  readonly lastSeenAt: number; // Timestamp
}
export interface BotForgeOptions extends BotOptions {
  sensory?: {
    viewDistance?: number;
    fovDegrees?: number;
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
}

/**
 * This internal class manages the sensory logic. It's not exported,
 * as its functionality will be merged into the BotForge instance.
 */
class SensoryManager {
  private readonly bot: Bot;
  private trackedPlayers: Map<string, TrackedPlayer> = new Map();
  private readonly viewDistance: number;
  private readonly fov: number; // Field of view in radians

  constructor(
    bot: Bot,
    options: { viewDistance?: number; fovDegrees?: number } = {}
  ) {
    this.bot = bot;
    this.viewDistance = options.viewDistance ?? 128;
    this.fov = (options.fovDegrees ?? 180) * (Math.PI / 180);

    // Heartbeat of the sensory system
    this.bot.on("physicsTick", () => this.updateTrackedPlayers());
  }

  private updateTrackedPlayers(): void {
    const now = Date.now();
    const currentPlayers = new Set<string>();

    for (const username in this.bot.players) {
      if (this.bot.username === username) continue; // Skip self

      const playerEntity = this.bot.players[username]?.entity;
      if (!playerEntity?.uuid) continue;

      currentPlayers.add(username);
      const { uuid } = playerEntity;

      const isInLineOfSight = this.isPlayerVisible(playerEntity);
      const existingData = _.cloneDeep(this.trackedPlayers.get(uuid));

      let newTrackedData: TrackedPlayer;

      const metadata = (playerEntity.metadata as any[]) || [];
      const hp = botUtils.currentHealth(playerEntity);
      const maxHp = 20;

      if (isInLineOfSight) {
        // Player is visible: Provide real-time data
        newTrackedData = {
          username: playerEntity.username!,
          uuid,
          position: playerEntity.position,
          velocity: playerEntity.velocity,
          heldItem: playerEntity.heldItem,
          armor: {
            head: playerEntity.equipment[1],
            torso: playerEntity.equipment[2],
            legs: playerEntity.equipment[3],
            feet: playerEntity.equipment[4],
          },
          isCrouching: (metadata[0] & 0x02) !== 0,
          isSprinting: (metadata[0] & 0x08) !== 0,
          isOnFire: (metadata[0] & 0x01) !== 0,
          healthStatus: this.getHealthStatus(hp, maxHp),
          isInLineOfSight: true,
          lastSeenAt: now,
        };
      } else {
        // Player is not visible: Provide last known or limited data
        const nametagVisible = !(metadata[0] & 0x02); // Not crouching
        newTrackedData = {
          username: playerEntity.username!,
          uuid,
          position: nametagVisible
            ? playerEntity.position
            : existingData?.position || null,
          velocity: nametagVisible ? playerEntity.velocity : new Vec3(0, 0, 0),
          heldItem: null,
          armor: { head: null, torso: null, legs: null, feet: null },
          isCrouching: null,
          isSprinting: null,
          isOnFire: null,
          healthStatus: PlayerHealthStatus.Unknown,
          isInLineOfSight: false,
          lastSeenAt: existingData?.lastSeenAt ?? 0,
        };
      }
      this.trackedPlayers.set(uuid, newTrackedData);
    }

    // Clean up players who have left the server
    for (const uuid of this.trackedPlayers.keys()) {
      const player = this.trackedPlayers.get(uuid);
      if (player && !currentPlayers.has(player.username)) {
        this.trackedPlayers.delete(uuid);
      }
    }
  }

  private isPlayerVisible(playerEntity: Entity): boolean {
    const botPosition = this.bot.entity.position.offset(
      0,
      this.bot.entity.height,
      0
    );
    const playerPosition = playerEntity.position.offset(
      0,
      playerEntity.height / 2,
      0
    );
    const distance = botPosition.distanceTo(playerPosition);

    if (distance > this.viewDistance) return false;

    const vectorToPlayer = playerPosition.subtract(botPosition);
    const currentViewVector = botUtils.currentView(this.bot);
    const angle = vectorUtils.angleBetween(currentViewVector, vectorToPlayer);

    if (angle > this.fov / 2) return false;

    const blockInWay = this.bot.world.raycast(
      botPosition,
      vectorToPlayer.normalize(),
      distance
    );
    return !blockInWay;
  }

  private getHealthStatus(
    health?: number,
    maxHealth?: number
  ): PlayerHealthStatus {
    if (health === undefined || maxHealth === undefined || maxHealth === 0) {
      return PlayerHealthStatus.Unknown;
    }
    const percentage = health / maxHealth;
    if (percentage > 0.75) return PlayerHealthStatus.Healthy;
    if (percentage > 0.25) return PlayerHealthStatus.Injured;
    return PlayerHealthStatus.BadlyWounded;
  }

  // --- PUBLIC API to be merged into the BotForge instance ---
  public getTrackedPlayers = (): TrackedPlayer[] => {
    return Array.from(this.trackedPlayers.values());
  };

  public findNearestEnemy = (): TrackedPlayer | null => {
    return (
      this.getTrackedPlayers()
        .filter((p) => p.position)
        .sort(
          (a, b) =>
            this.bot.entity.position.distanceTo(a.position!) -
            this.bot.entity.position.distanceTo(b.position!)
        )[0] || null
    );
  };
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
  const { sensory, ...botOptions } = options;
  const bot = mineflayer.createBot(botOptions);
  const sensoryManager = new SensoryManager(bot, sensory);

  (bot as any).getTrackedPlayers = sensoryManager.getTrackedPlayers;
  (bot as any).findNearestEnemy = sensoryManager.findNearestEnemy;

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
    "setControlState",
    // ^ Consider adding other crucial methods your bot will need to function.

    // Our custom functions
    "getTrackedPlayers",
    "findNearestEnemy",
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

      console.error(
        `[BotForge] Blocked access to restricted property: "${String(prop)}"`
      );
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
