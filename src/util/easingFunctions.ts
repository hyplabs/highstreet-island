export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutQuadratic(x: number): number {
  const invert = 1 - x;
  return 1 - invert * invert;
}
