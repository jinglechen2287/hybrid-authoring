/**
 * Convert an angle from radians to degrees.
 *
 * @param radians - The angle measured in radians
 * @returns The angle measured in degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Convert an angle from degrees to radians.
 *
 * @param degrees - Angle measured in degrees
 * @returns The angle converted to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}