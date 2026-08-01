import { Vector3 } from "@minecraft/server";

export function distance(a: Vector3, b: Vector3) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function horizontalDistance(a: Vector3, b: Vector3) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function roundTo(value: number, places: number) {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

export function yawTo(from: Vector3, to: Vector3) {
  return Math.atan2(to.z - from.z, to.x - from.x) * (180 / Math.PI) - 90;
}

export function angleDifference(a: number, b: number) {
  let delta = (a - b) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return Math.abs(delta);
}

export function viewAngleTo(from: Vector3, to: Vector3, yaw: number) {
  return angleDifference(yawTo(from, to), yaw);
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return Number.MAX_SAFE_INTEGER;
  let total = 0;
  for (const value of values) total += value;
  const mean = total / values.length;
  let variance = 0;
  for (const value of values) {
    const delta = value - mean;
    variance += delta * delta;
  }
  return Math.sqrt(variance / values.length);
}

export function distanceToBox(point: Vector3, center: Vector3, width: number, height: number) {
  const half = width / 2;
  const dx = Math.max(Math.abs(point.x - center.x) - half, 0);
  const dz = Math.max(Math.abs(point.z - center.z) - half, 0);
  const top = center.y + height;
  const dy = point.y < center.y ? center.y - point.y : point.y > top ? point.y - top : 0;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
