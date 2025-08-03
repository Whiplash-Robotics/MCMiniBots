import { Bot } from "mineflayer";
import { Item } from "prismarine-item";
import { performance } from "node:perf_hooks";

/**
 * A module to track PvP state, specifically attack cooldowns and critical hit windows.
 */
export class PVPModule {
  private readonly bot: Bot;
  private lastAttackResetTime: number;

  constructor(bot: Bot) {
    this.bot = bot;
    this.lastAttackResetTime = performance.now() - 5000;
    this.resetAttackCooldown = this.resetAttackCooldown.bind(this);
    this.initialize();
  }

  private initialize(): void {
    this.bot.once("spawn", () => {
      console.log("PVPModule Initialized: Setting up listeners.");
      this.resetAttackCooldown();
      // @ts-ignore
      this.bot.on("heldItemChanged", this.resetAttackCooldown);
      const originalAttack = this.bot.attack.bind(this.bot);
      //@ts-ignore
      this.bot.attack = (targetUUID: string) => {
        const targetEntity = Object.values(this.bot.players).find(
          (player) => player.uuid === targetUUID
        );
        if (
          targetEntity &&
          this.bot.entityAtCursor(3.35)?.uuid === targetUUID &&
          !this.bot.usingHeldItem
        ) {
          originalAttack(targetEntity.entity);
          this.resetAttackCooldown();
        }
      };
    });
  }

  public resetAttackCooldown(): void {
    this.lastAttackResetTime = performance.now();
  }

  private getAttackSpeed(item: Item | null): number {
    if (!item) return 4;
    const name = item.name;
    if (name.includes("sword")) return 1.6;
    if (name.includes("trident")) return 1.1;
    if (name.includes("shovel")) return 1;
    if (name.includes("pickaxe")) return 1.2;
    if (name.includes("axe")) {
      if (name.includes("wooden") || name.includes("stone")) return 0.8;
      if (name.includes("iron")) return 0.9;
      if (name.includes("diamond") || name.includes("netherite")) return 1;
      if (name.includes("golden")) return 1;
    }
    if (name.includes("hoe")) {
      if (name.includes("wooden") || name.includes("golden")) return 1;
      if (name.includes("stone")) return 2;
      if (name.includes("iron")) return 3;
      if (name.includes("diamond") || name.includes("netherite")) return 4;
    }
    return 4;
  }

  public get strongAttackCharged(): boolean {
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);
    const cooldownMs = (1 / attackSpeed) * 1000;
    const elapsedMs = performance.now() - this.lastAttackResetTime;
    return elapsedMs >= cooldownMs;
  }

  public get damageMultiplier(): number {
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);
    const T = (1 / attackSpeed) * 20;
    const elapsedMs = performance.now() - this.lastAttackResetTime;
    const x = elapsedMs / 50;
    const multiplier = 0.2 + Math.pow((x + 0.5) / T, 2) * 0.8;
    return Math.max(0.2, Math.min(1.0, multiplier));
  }

  /**
   * Checks if all conditions for a critical hit are currently met.
   * @returns {boolean} True if attacking now would result in a critical hit.
   */
  public get inCritWindow(): boolean {
    const entity = this.bot.entity;

    // Must be falling and not on the ground.
    if (entity.velocity.y >= 0 || entity.onGround) return false;

    // Must not be riding anything.
    if (entity.vehicle) return false;

    // Must not have Blindness (ID 15) or Slow Falling (ID 28).
    // @ts-ignore - effect IDs are numbers
    if (entity.effects[15] || entity.effects[28]) return false;

    // Must not be in a block that prevents crits.
    const blockIn = this.bot.blockAt(entity.position);
    if (blockIn) {
      const blockName = blockIn.name;
      if (
        blockName === "water" ||
        blockName === "ladder" ||
        blockName.includes("vine") ||
        blockName === "cobweb" ||
        blockName === "scaffolding" ||
        blockName === "honey_block"
      ) {
        return false;
      }
    }

    // Attack cooldown must be at least 84.8% charged.
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);
    const cooldownMs = (1 / attackSpeed) * 1000;
    const elapsedMs = performance.now() - this.lastAttackResetTime;

    if (elapsedMs / cooldownMs < 0.848) {
      return false;
    }

    // All conditions met.
    return true;
  }
}
