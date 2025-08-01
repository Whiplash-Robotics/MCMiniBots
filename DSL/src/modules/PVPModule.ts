import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { performance } from "node:perf_hooks";

export class PVPModule {
  private readonly bot: Bot;
  private lastAttackResetTime: number;
  private previousHeldItemName: string | null;

  constructor(bot: Bot) {
    this.bot = bot;
    // Initialize the timer so the bot starts with a full charge
    this.lastAttackResetTime = performance.now() - 5000; // Subtract 5s to ensure it's initially charged
    this.previousHeldItemName = this.bot.heldItem
      ? this.bot.heldItem.name
      : null;

    this.bot.on("physicsTick", this.checkHeldItemChange);
    this.bot.on("spawn", () => {
      const originalAttack = this.bot.attack.bind(this.bot);

      //@ts-ignore
      this.bot.attack = (targetUUID: string) => {
        const players = this.bot.players;
        const targetEntity = Object.values(players).find(
          (player) => player.uuid === targetUUID
        );
        if (targetEntity) {
          originalAttack(targetEntity.entity);
        }
      };
    });
  }
  private checkHeldItemChange = (): void => {
    const currentItemName = this.bot.heldItem ? this.bot.heldItem.name : null;
    if (currentItemName !== this.previousHeldItemName) {
      this.resetAttackCooldown();
      this.previousHeldItemName = currentItemName;
    }
  };
  /**
   * Resets the attack cooldown timer to the current time.
   */
  private resetAttackCooldown = (): void => {
    console.log("Attack cooldown reset.");
    this.lastAttackResetTime = performance.now();
  };

  /**
   * Determines the attack speed for the currently held item.
   * @param item The item to check.
   * @returns The attack speed value.
   */
  private getAttackSpeed(item: Item | null): number {
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

  public get strongAttackCharged(): boolean {
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);
    const cooldownMs = (1 / attackSpeed) * 1000; // Cooldown in milliseconds
    const elapsedMs = performance.now() - this.lastAttackResetTime;

    return elapsedMs >= cooldownMs;
  }

  public get damageMultiplier(): number {
    const heldItem = this.bot.heldItem;
    const attackSpeed = this.getAttackSpeed(heldItem);

    // T = Number of ticks until strong attack is ready
    const T = (1 / attackSpeed) * 20;

    // x = Number of ticks since last attack/item switch
    const elapsedMs = performance.now() - this.lastAttackResetTime;
    const x = elapsedMs / 50; // 1 tick = 50ms

    // Formula: (0.2 + ((x + 0.5) / T))^2 * 0.8
    const base = 0.2 + (x + 0.5) / T;
    const multiplier = Math.pow(base, 2) * 0.8;

    // Clamp the result between 0.2 and 1.0
    return Math.max(0.2, Math.min(1.0, multiplier));
  }
}
