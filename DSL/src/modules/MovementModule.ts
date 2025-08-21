import { Bot } from "mineflayer";
import { performance } from "node:perf_hooks";

const DEACTIVATED = -1;

export class MovementModule {
  private readonly bot: Bot;
  private jumpStateExpire: number;
  private forwardStateExpire: number;
  private backStateExpire: number;
  private leftStateExpire: number;
  private rightStateExpire: number;
  private sneakStateExpire: number;
  private sprintStateExpire: number;

  constructor(bot: Bot) {
    this.bot = bot;
    this.forwardStateExpire = DEACTIVATED;
    this.backStateExpire = DEACTIVATED;
    this.leftStateExpire = DEACTIVATED;
    this.rightStateExpire = DEACTIVATED;
    this.jumpStateExpire = DEACTIVATED;
    this.sneakStateExpire = DEACTIVATED;
    this.sprintStateExpire = DEACTIVATED;

    this.bot.on("physicsTick", () => {
      const now = performance.now();
      if (
        this.forwardStateExpire != DEACTIVATED &&
        this.forwardStateExpire < now
      ) {
        this.bot.setControlState("forward", false);
        console.log(now);
        this.forwardStateExpire = DEACTIVATED;
      }
      if (this.backStateExpire != DEACTIVATED && this.backStateExpire < now) {
        this.bot.setControlState("back", false);
        this.backStateExpire = DEACTIVATED;
      }
      if (this.leftStateExpire != DEACTIVATED && this.leftStateExpire < now) {
        this.bot.setControlState("left", false);
        this.leftStateExpire = DEACTIVATED;
      }
      if (this.rightStateExpire != DEACTIVATED && this.rightStateExpire < now) {
        this.bot.setControlState("right", false);
        this.rightStateExpire = DEACTIVATED;
      }
      if (this.jumpStateExpire != DEACTIVATED && this.jumpStateExpire < now) {
        this.bot.setControlState("jump", false);
        this.jumpStateExpire = DEACTIVATED;
      }
      if (this.sneakStateExpire != DEACTIVATED && this.sneakStateExpire < now) {
        this.bot.setControlState("sneak", false);
        this.sneakStateExpire = DEACTIVATED;
      }
      if (
        this.sprintStateExpire != DEACTIVATED &&
        this.sprintStateExpire < now
      ) {
        this.bot.setControlState("sprint", false);
        this.sprintStateExpire = DEACTIVATED;
      }
    });
  }

  public moveForward = (duration: number) => {
    this.bot.setControlState("forward", true);
    this.forwardStateExpire = performance.now() + duration;
    console.log(performance.now());
  };

  public moveBackward = (duration: number) => {
    this.bot.setControlState("back", true);
    this.backStateExpire = performance.now() + duration;
  };

  public moveLeft = (duration: number) => {
    this.bot.setControlState("left", true);
    this.leftStateExpire = performance.now() + duration;
  };

  public moveRight = (duration: number) => {
    this.bot.setControlState("right", true);
    this.rightStateExpire = performance.now() + duration;
  };

  public jump = (duration: number) => {
    this.bot.setControlState("jump", true);
    this.jumpStateExpire = performance.now() + duration;
  };

  public sneak = (duration: number) => {
    this.bot.setControlState("sneak", true);
    this.sneakStateExpire = performance.now() + duration;
  };

  public sprint = (duration: number) => {
    this.bot.setControlState("sprint", true);
    this.sprintStateExpire = performance.now() + duration;
  };
}
