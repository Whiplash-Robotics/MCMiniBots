import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import { performance } from "node:perf_hooks";
import { getFuzzySound } from "../../utils/vector.js"; // Assuming getFuzzySound is in this utils file

export interface SoundEvent {
  readonly soundId: number;
  readonly soundCategoryIndex: number;
  readonly soundCategory: string;
  readonly position: Vec3;
  readonly timestamp: number;
}

interface SoundModuleOptions {
  maxSoundAge?: number; // How long to remember a sound in milliseconds.
  fuzzyAngle?: number; // The max angle in degrees for sound direction uncertainty.
  pruneInterval?: number; // How often to prune old sounds in milliseconds.
}

export class SoundModule {
  private readonly bot: Bot;
  private recentSounds: SoundEvent[] = [];
  private readonly maxSoundAge: number;
  private readonly fuzzyAngle: number;
  private readonly soundCategoryMap: Record<number, string> = {
    0: "master",
    1: "music",
    2: "record",
    3: "weather",
    4: "block",
    5: "neutral",
    6: "player",
    7: "hostile",
    8: "ambient",
    9: "voice",
  };

  constructor(bot: Bot, options: SoundModuleOptions = {}) {
    this.bot = bot;
    this.maxSoundAge = options.maxSoundAge ?? 5000; // Default to 5 seconds
    this.fuzzyAngle = options.fuzzyAngle ?? 10; // Default to 10 degrees
    const pruneInterval = options.pruneInterval ?? 1000; // Default to 1 second

    this.bot.on("hardcodedSoundEffectHeard", this.handleSoundEvent);
    setInterval(this.pruneOldSounds, pruneInterval);
  }

  /**
   * The core listener that processes incoming sound packets.
   */
  private handleSoundEvent = (
    soundId: number,
    soundCategory: number,
    position: Vec3
  ): void => {
    // Use the provided utility to create an imprecise sound location
    const fuzzyPosition = getFuzzySound(
      position,
      this.bot.entity.position,
      this.fuzzyAngle
    );

    const soundEvent: SoundEvent = {
      soundId,
      soundCategoryIndex: soundCategory,
      soundCategory: this.soundCategoryMap[soundCategory] || "unknown",
      position: fuzzyPosition,
      timestamp: performance.now(),
    };

    this.recentSounds.push(soundEvent);
  };

  /**
   * Periodically cleans up sounds that are older than maxSoundAge.
   */
  private pruneOldSounds = (): void => {
    const now = performance.now();
    this.recentSounds = this.recentSounds.filter(
      (sound) => now - sound.timestamp < this.maxSoundAge
    );
  };

  public getRecentSounds = (): SoundEvent[] => {
    return [...this.recentSounds];
  };
}
