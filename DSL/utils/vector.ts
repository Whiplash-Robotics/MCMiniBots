import { Vec3 } from "vec3";
export function angleBetween(a: Vec3, b: Vec3): number {
  const denom = a.norm() * b.norm();
  if (denom === 0) return 0;
  const cos = a.dot(b) / denom;
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}
