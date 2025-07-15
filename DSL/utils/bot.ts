import { Vec3 } from "vec3";
import { Bot } from "mineflayer";
// ───────── utils/bot.ts ─────────
import { Entity } from "prismarine-entity";

/** Metadata index that holds the health float (1.20+ = 9, 1.17 + = 8, ≤1.16 = 7). */
const HEALTH_META_IDX = 9;

/** Read a metadata entry regardless of 1.17+ object wrapper */
function metaFloat(e: Entity, idx: number): number | undefined {
  const m = e.metadata?.[idx];
  if (m == null) return undefined;
  return typeof m === "object" ? (m as any).value : (m as number);
}

/** Current visible hearts (0 – 20) for any player entity. */
export function currentHealth(e: Entity): number | undefined {
  return metaFloat(e, HEALTH_META_IDX);
}

/** Maximum hearts, accounting for servers pre‑/post‑1.17. */

export function currentView(bot: Bot): Vec3 {
  const { yaw, pitch } = bot.entity; // radians :contentReference[oaicite:0]{index=0}

  // Minecraft’s 3‑D maths (0 yaw = looking NORTH / –Z)
  const x = -Math.sin(yaw) * Math.cos(pitch);
  const y = -Math.sin(pitch);
  const z = -Math.cos(yaw) * Math.cos(pitch);

  return new Vec3(x, y, z); // already unit‑length
}
