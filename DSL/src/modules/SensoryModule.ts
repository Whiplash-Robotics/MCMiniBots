import { Bot } from "mineflayer";
import { TrackedPlayer, PlayerHealthStatus } from "../types.js";
import { Entity } from "prismarine-entity";
import { Vec3 } from "vec3";
import * as vectorUtils from "../utils/vector.js";
import * as botUtils from "../utils/bot.js";
import _ from "lodash";

/**
 * Defines the different states of visibility for a player.
 */
enum Visibility {
  DirectSight, // In FOV and unobstructed.
  ObstructedInFov, // In FOV but behind a wall.
  OutOfFov, // Outside the bot's viewing cone.
}

export class SensoryModule {
  private readonly bot: Bot;
  private trackedPlayers: Map<string, TrackedPlayer> = new Map();
  private readonly viewDistance: number;
  private readonly fov: number;

  constructor(
    bot: Bot,
    options: { viewDistance?: number; fovDegrees?: number } = {}
  ) {
    this.bot = bot;
    this.viewDistance = options.viewDistance ?? 128;
    this.fov = (options.fovDegrees ?? 180) * (Math.PI / 180);
    this.bot.on("physicsTick", () => this.updateTrackedPlayers());
  }

  private updateTrackedPlayers(): void {
    const now = Date.now();
    const currentPlayers = new Set<string>();

    for (const username in this.bot.players) {
      if (this.bot.username === username) continue;

      const playerEntity = this.bot.players[username]?.entity;
      if (!playerEntity?.uuid) continue;

      currentPlayers.add(username);
      const { uuid } = playerEntity;

      const visibility = this.getPlayerVisibility(playerEntity);
      const existingData = _.cloneDeep(this.trackedPlayers.get(uuid));
      const metadata = (playerEntity.metadata as any[]) || [];
      const isCurrentlyCrouching = (metadata[0] & 0x02) !== 0;

      let newTrackedData: TrackedPlayer;

      if (visibility === Visibility.DirectSight) {
        // Player is fully visible: Provide all real-time data.
        const hp = botUtils.currentHealth(playerEntity);
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
          isCrouching: isCurrentlyCrouching,
          isSprinting: (metadata[0] & 0x08) !== 0,
          isOnFire: (metadata[0] & 0x01) !== 0,
          healthStatus: this.getHealthStatus(hp, 20),
          isInLineOfSight: true,
          lastSeenAt: now,
        };
      } else {
        // Player is not in direct sight. Determine what, if anything, the bot knows.
        let knownPosition = existingData?.position || null;
        let knownVelocity = new Vec3(0, 0, 0);

        if (
          visibility === Visibility.ObstructedInFov &&
          !isCurrentlyCrouching
        ) {
          // Special case: In FOV and standing, so their nametag is visible through walls.
          knownPosition = playerEntity.position;
          knownVelocity = playerEntity.velocity;
        }
        // In all other cases (out of FOV, or obstructed while crouching),
        // the bot only knows their last seen position.

        newTrackedData = {
          username: playerEntity.username!,
          uuid,
          position: knownPosition,
          velocity: knownVelocity,
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

  /**
   * Determines if a player is in the bot's FOV and/or direct line of sight.
   */
  private getPlayerVisibility(playerEntity: Entity): Visibility {
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
      return Visibility.OutOfFov; // Treat out of range as out of FOV
    }

    const vectorToPlayer = playerPosition.subtract(botPosition);
    const currentViewVector = botUtils.currentView(this.bot);
    const angle = vectorUtils.angleBetween(currentViewVector, vectorToPlayer);

    if (angle > this.fov / 2) {
      return Visibility.OutOfFov; // Player is outside the FOV cone.
    }

    // Player is in FOV, now check for obstructions.
    const blockInWay = this.bot.world.raycast(
      botPosition,
      vectorToPlayer.normalize(),
      distance
    );

    return blockInWay ? Visibility.ObstructedInFov : Visibility.DirectSight;
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
