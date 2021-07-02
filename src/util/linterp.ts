// linear interpolation
export function linterp(from: number, to: number, progress: number) {
  return (1 - progress) * from + to * progress;
}
