import { Bot } from "mineflayer";
import { TrackedPlayer, PlayerHealthStatus } from "../types.js";
import { Entity } from "prismarine-entity";
import { Vec3 } from "vec3";
import * as vectorUtils from "../../utils/vector.js"; // Assuming these utils exist
import * as botUtils from "../../utils/bot.js"; // Assuming these utils exist
import _ from "lodash";
/**
 * This internal class manages the sensory logic. It's not exported,
 * as its functionality will be merged into the BotForge instance.
 */
export class SensoryModule {
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
