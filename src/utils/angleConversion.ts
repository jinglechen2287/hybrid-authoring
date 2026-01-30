export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
