import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { Vec3 } from "vec3";
import * as vectorUtils from "../utils/vector.js";
import * as botUtils from "../utils/bot.js";

/**
 * Represents the abstracted health status of a player.
 * Instead of giving the bot exact HP, we provide a more general status,
 * forcing the AI to make inferences.
 */
export enum PlayerHealthStatus {
  Healthy = "Healthy", // > 75% HP
  Injured = "Injured", // 25% - 75% HP
  BadlyWounded = "BadlyWounded", // < 25% HP
  Unknown = "Unknown", // Health cannot be determined (e.g., out of sight)
}

/**
 * A "nerfed" representation of an enemy player. This is the data structure
 * your bot's AI will receive. It contains only the information that a real
 * player could reasonably know, with limitations based on line of sight.
 */
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
  readonly lastSeenAt: number; // Timestamp of the last time the player was in LoS
}

/**
 * Manages the bot's perception of other players, enforcing a "fog of war".
 * It wraps the raw bot.players data and provides a limited, more realistic
 * view of the world.
 */
export class SensoryModule {
  private bot: Bot;
  private trackedPlayers: Map<string, TrackedPlayer> = new Map();
  private readonly viewDistance: number;
  private readonly fov: number; // Field of view in radians

  /**
   * @param bot The mineflayer bot instance.
   * @param options Configuration options for the sensory module.
   * @param options.viewDistance How far the bot can see players.
   * @param options.fovDegrees The horizontal field of view in degrees.
   */
  constructor(
    bot: Bot,
    options: { viewDistance?: number; fovDegrees?: number } = {}
  ) {
    this.bot = bot;
    this.viewDistance = options.viewDistance ?? 128; // Default view distance
    this.fov = (options.fovDegrees ?? 180) * (Math.PI / 180); // Default 180 degree FOV

    // Hook into the bot's physics tick to run updates continuously.
    // This is the heartbeat of the sensory system.
    this.bot.on("physicTick", () => this.updateTrackedPlayers());
  }

  /**
   * Core update loop, called on every physics tick.
   * This method re-evaluates the status of all known players.
   */
  private updateTrackedPlayers(): void {
    const now = Date.now();
    const currentPlayers = new Set<string>();

    for (const username in this.bot.players) {
      if (this.bot.username === username) continue; // Skip self

      const playerEntity = this.bot.players[username]?.entity;
      if (!playerEntity) continue;

      currentPlayers.add(username);
      const uuid = playerEntity.uuid;

      if (!uuid) return; // Skip if no UUID

      // Determine if the player is currently visible.
      const isInLineOfSight = this.isPlayerVisible(playerEntity);
      const existingData = this.trackedPlayers.get(uuid);

      let newTrackedData: TrackedPlayer;

      const metadata = playerEntity.metadata as Number[];
      const hp = botUtils.currentHealth(playerEntity);
      const max = 20; // Assuming 20 is the max health for players
      if (isInLineOfSight) {
        // Player is IN VISION: Provide detailed, real-time information.
        newTrackedData = {
          username: playerEntity.username!,
          uuid: playerEntity.uuid!,
          position: playerEntity.position,
          velocity: playerEntity.velocity,
          heldItem: playerEntity.heldItem,
          armor: {
            head: playerEntity.equipment[1],
            torso: playerEntity.equipment[2],
            legs: playerEntity.equipment[3],
            feet: playerEntity.equipment[4],
          },
          isCrouching: metadata[0] === 2, // Using metadata to check crouch status
          isSprinting: metadata[0] === 8, // Using metadata to check sprint status
          isOnFire: metadata[0] === 1, // Using metadata to check fire status
          healthStatus: this.getHealthStatus(hp, max), // Assuming 20 is max health
          isInLineOfSight: true,
          lastSeenAt: now,
        };
      } else {
        // Player is OUT OF VISION: Provide limited, stale, or inferred information.
        // const isAudible = !playerEntity.metadata[0] === 2;
        const isAudible = true;
        newTrackedData = {
          username: playerEntity.username!,
          uuid: playerEntity.uuid!,
          // Position and velocity are only known if the player is making noise (not crouching).
          // Otherwise, we provide the last known position.
          position: isAudible
            ? playerEntity.position
            : existingData?.position || null,
          velocity: isAudible ? playerEntity.velocity : new Vec3(0, 0, 0),
          // Sensitive information is hidden.
          heldItem: null,
          armor: { head: null, torso: null, legs: null, feet: null },
          isCrouching: null, // We don't know for sure if they are crouching now.
          isSprinting: null,
          isOnFire: null,
          healthStatus: PlayerHealthStatus.Unknown,
          isInLineOfSight: false,
          lastSeenAt: existingData?.lastSeenAt ?? 0,
        };
      }
      this.trackedPlayers.set(uuid, newTrackedData);
    }

    // Clean up players who have left the server or are out of range.
    for (const uuid of this.trackedPlayers.keys()) {
      if (!currentPlayers.has(this.trackedPlayers.get(uuid)!.username)) {
        this.trackedPlayers.delete(uuid);
      }
    }
  }

  /**
   * Determines if a player is within the bot's direct field of vision.
   * This involves two checks:
   * 1. Is the player within the bot's view cone (angle check)?
   * 2. Is there an unobstructed line of sight (raycast check)?
   * @param playerEntity The entity to check.
   * @returns True if the player is visible, false otherwise.
   */
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

    if (distance > this.viewDistance) {
      return false; // Player is too far away.
    }

    // 1. Angle Check
    const vectorToPlayer = playerPosition.subtract(botPosition);

    const currentViewVector = botUtils.currentView(this.bot);

    const angle = vectorUtils.angleBetween(currentViewVector, vectorToPlayer);
    if (angle > this.fov / 2) {
      return false; // Player is outside the bot's Field of View cone.
    }

    // 2. Raycast Check (Line of Sight)
    const blockInWay = this.bot.world.raycast(
      botPosition,
      vectorToPlayer.normalize(),
      distance
    );
    return !blockInWay; // If raycast returns null, there's nothing in the way.
  }

  /**
   * Converts a player's raw health and max health into a simplified status enum.
   * @param health Current health.
   * @param maxHealth Maximum health.
   * @returns A PlayerHealthStatus enum value.
   */
  private getHealthStatus(
    health: number | undefined,
    maxHealth: number | undefined
  ): PlayerHealthStatus {
    if (health === undefined || maxHealth === undefined || maxHealth === 0) {
      return PlayerHealthStatus.Unknown;
    }
    const percentage = health / maxHealth;
    if (percentage > 0.75) return PlayerHealthStatus.Healthy;
    if (percentage > 0.25) return PlayerHealthStatus.Injured;
    return PlayerHealthStatus.BadlyWounded;
  }

  // --- PUBLIC API for the bot's AI ---

  /**
   * Gets a list of all players the bot is currently aware of.
   * @returns An array of TrackedPlayer objects.
   */
  public getTrackedPlayers(): TrackedPlayer[] {
    return Array.from(this.trackedPlayers.values());
  }

  /**
   * Finds the nearest enemy based on the currently tracked information.
   * @returns The nearest TrackedPlayer object, or null if no players are tracked.
   */
  public findNearestEnemy(): TrackedPlayer | null {
    let nearestPlayer: TrackedPlayer | null = null;
    let minDistance = Infinity;

    for (const player of this.trackedPlayers.values()) {
      if (player.position) {
        const distance = this.bot.entity.position.distanceTo(player.position);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPlayer = player;
        }
      }
    }
    return nearestPlayer;
  }
}

// --- Example Usage ---
// This is how you would integrate the SensoryModule into your main bot file.

// import mineflayer from "mineflayer";

// const bot = mineflayer.createBot({
//   host: "localhost",
//   port: 25565,
//   username: "PvPBot",
// });

// bot.once("spawn", () => {
//   console.log("Bot has spawned. Initializing SensoryModule.");
//   const sensoryModule = new SensoryModule(bot, { fovDegrees: 180 });

//   bot.on("physicTick", () => {
//     const nearestEnemy = sensoryModule.findNearestEnemy();

//     if (nearestEnemy) {
//       if (nearestEnemy.isInLineOfSight) {
//         console.log(
//           `I see ${nearestEnemy.username}! ` +
//             `Status: ${nearestEnemy.healthStatus}. ` +
//             `They are holding: ${nearestEnemy.heldItem?.displayName}.`
//         );
//       } else {
//         console.log(
//           `I've lost sight of ${nearestEnemy.username}. Last seen at ${nearestEnemy.position}`
//         );
//       }
//     } else {
//       console.log("Searching for targets...");
//     }
//   });
// });
