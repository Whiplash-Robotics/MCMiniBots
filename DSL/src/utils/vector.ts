import { Vec3 } from "vec3";
export function angleBetween(a: Vec3, b: Vec3): number {
  const denom = a.norm() * b.norm();
  if (denom === 0) return 0;
  const cos = a.dot(b) / denom;
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

/**
 * Generates a random point on a spherical cap defined by a source vector and an angle.
 * @param soundSource The vector representing the sound's origin, defining the cap's direction and radius.
 * @param maxAngleDegrees The maximum deviation angle in degrees, defining the cap's size.
 * @returns A random point on the spherical cap's surface.
 */
import MersenneTwister from "mersenne-twister";

export function getFuzzySound(
  soundSource: Vec3,
  origin: Vec3,
  maxAngleDegrees: number,
  rng: MersenneTwister
): Vec3 {
  const relativeSourceVector = soundSource.subtract(origin);
  const R = relativeSourceVector.norm(); // .norm() is the magnitude in the vec3 library

  if (R === 0) {
    return new Vec3(origin.x, origin.y, origin.z);
  }

  const s_hat = relativeSourceVector.normalize();
  const maxAngleRad = (maxAngleDegrees * Math.PI) / 180;

  const phi = rng.random() * 2 * Math.PI;
  const cosMaxAngle = Math.cos(maxAngleRad);
  const cos_theta = rng.random() * (1 - cosMaxAngle) + cosMaxAngle;
  const sin_theta = Math.sqrt(1 - cos_theta * cos_theta);

  let a: Vec3 = new Vec3(1, 0, 0);
  if (Math.abs(s_hat.x) > 0.9999) {
    a = new Vec3(0, 1, 0);
  }
  const u_hat = a.cross(s_hat).normalize();
  const v_hat = s_hat.cross(u_hat);

  const point_in_u = u_hat.scale(R * sin_theta * Math.cos(phi));
  const point_in_v = v_hat.scale(R * sin_theta * Math.sin(phi));
  const point_in_s = s_hat.scale(R * cos_theta);

  const pointRelativeToOrigin = point_in_u.add(point_in_v).add(point_in_s);

  return pointRelativeToOrigin.add(origin);
}
