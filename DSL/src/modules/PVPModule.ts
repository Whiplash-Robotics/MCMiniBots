import { Bot } from "mineflayer";
import { Item } from "prismarine-item";
import { performance } from "node:perf_hooks";

/**
 * A module to track PvP state, specifically the strong attack cooldown.
 */
export class PVPModule {
  private readonly bot: Bot;
  private lastAttackResetTime: number;

  constructor(bot: Bot) {
    this.bot = bot;
    // Initialize with a value that ensures the attack is charged on first spawn.
    this.lastAttackResetTime = performance.now() - 5000;

    // Bind the context of 'this' for event handlers
    this.resetAttackCooldown = this.resetAttackCooldown.bind(this);

    this.initialize();
  }

  /**
   * Sets up the necessary event listeners after the bot has spawned.
   */
  private initialize(): void {
    this.bot.once("spawn", () => {
      console.log("PVPModule Initialized: Setting up listeners.");

      this.resetAttackCooldown();

      // @ts-ignore - This event is valid and documented, but may be missing from older TS type definitions.
      this.bot.on("heldItemChanged", this.resetAttackCooldown);
      const originalAttack = this.bot.attack.bind(this.bot);
      //@ts-ignore
      this.bot.attack = (targetUUID: string) => {
        const players = this.bot.players;
        const targetEntity = Object.values(players).find(
          (player) => player.uuid === targetUUID
        );
        if (
          targetEntity &&
          this.bot.entityAtCursor(3.35)?.uuid === targetUUID
        ) {
          originalAttack(targetEntity.entity);
          this.resetAttackCooldown();
        }
      };
    });
  }

  /**
   * Resets the attack cooldown timer to the current time.
   * This is triggered by switching items or attacking.
   */
  public resetAttackCooldown(): void {
    this.lastAttackResetTime = performance.now();
  }

  /**
   * Determines the attack speed for the currently held item based on Minecraft mechanics.
   * Attack speed is the number of attacks per second.
   * @param item The item to check.
   * @returns The attack speed value.
   */
  private getAttackSpeed(item: Item | null): number {
    // These values are based on the Minecraft Wiki for Java Edition.
    if (!item) return 4; // Default for empty hand

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

    return 4; // Default for all other items
  }

  /**
   * Checks if the strong attack is fully charged.
   * @returns {boolean} True if the attack is charged, false otherwise.
   */
  public get strongAttackCharged(): boolean {
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);
    // Cooldown is the inverse of attack speed.
    const cooldownMs = (1 / attackSpeed) * 1000;
    const elapsedMs = performance.now() - this.lastAttackResetTime;

    return elapsedMs >= cooldownMs;
  }

  /**
   * Calculates the current damage multiplier based on the attack charge.
   * The formula is based on the official Minecraft Wiki.
   * @returns {number} A value between 0.2 and 1.0.
   */
  public get damageMultiplier(): number {
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);

    // T = Number of game ticks until the strong attack is ready (1 tick = 50ms).
    const T = (1 / attackSpeed) * 20;

    // x = Number of ticks since the last cooldown reset.
    const elapsedMs = performance.now() - this.lastAttackResetTime;
    const x = elapsedMs / 50;

    // The damage multiplier formula from the Minecraft Wiki.
    const multiplier = 0.2 + Math.pow((x + 0.5) / T, 2) * 0.8;

    // The multiplier cannot be less than 0.2 or more than 1.0.
    return Math.max(0.2, Math.min(1.0, multiplier));
  }
}
