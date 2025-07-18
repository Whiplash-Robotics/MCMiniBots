import { Vec3 } from "vec3";
import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";

/** Metadata index that holds the health float (1.20+ = 9, 1.17 + = 8, ≤1.16 = 7). */
const HEALTH_META_IDX = 9;

function metaFloat(e: Entity, idx: number): number | undefined {
  const m = e.metadata?.[idx];
  if (m == null) return undefined;
  return typeof m === "object" ? (m as any).value : (m as number);
}

export function currentHealth(e: Entity): number | undefined {
  return metaFloat(e, HEALTH_META_IDX);
}

export function currentView(bot: Bot): Vec3 {
  const { yaw, pitch } = bot.entity; // radians :contentReference[oaicite:0]{index=0}

  const x = -Math.sin(yaw) * Math.cos(pitch);
  const y = -Math.sin(pitch);
  const z = -Math.cos(yaw) * Math.cos(pitch);

  return new Vec3(x, y, z); // already unit‑length
}
