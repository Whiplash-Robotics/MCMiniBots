import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import { performance } from "node:perf_hooks";
import { getFuzzySound } from "../utils/vector.js"; // Assuming getFuzzySound is in this utils file
import MersenneTwister from "mersenne-twister";
export interface SoundEvent {
  readonly soundName: string;
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
  private readonly rng: MersenneTwister;

  constructor(bot: Bot, options: SoundModuleOptions = {}) {
    this.bot = bot;
    this.maxSoundAge = options.maxSoundAge ?? 5000; // Default to 5 seconds
    this.fuzzyAngle = options.fuzzyAngle ?? 10; // Default to 10 degrees
    const pruneInterval = options.pruneInterval ?? 1000; // Default to 1 second
    this.rng = new MersenneTwister();

    this.bot.on("soundEffectHeard", this.handleSoundEvent);
    setInterval(this.pruneOldSounds, pruneInterval);
  }

  /**
   * The core listener that processes incoming sound packets.
   */
  private handleSoundEvent = (soundName: string, position: Vec3): void => {
    const fuzzyPosition = getFuzzySound(
      position,
      this.bot.entity.position,
      this.fuzzyAngle,
      this.rng
    );

    const soundEvent: SoundEvent = {
      soundName,
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
