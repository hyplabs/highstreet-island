let lastLogTime = 0;
export function throttleLog(msg: any) {
  const now = performance.now();
  if (now - lastLogTime < 500) return;
  lastLogTime = now;
  console.log(msg);
}
