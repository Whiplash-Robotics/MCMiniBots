import { Item } from "prismarine-item";
import { Vec3 } from "vec3";

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
