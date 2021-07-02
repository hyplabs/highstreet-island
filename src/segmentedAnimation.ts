export interface PathSegment {
  startTime: number;
  update: (progress: number, isStart: boolean) => void;
}

// helper for animating predefined sequence of animations
export function segmentedAnimation(segments: PathSegment[]) {
  let lastSegment: PathSegment | null = null;
  function getActiveSegment(tCycle: number) {
    for (let i = 0; i < segments.length; i++) {
      if (tCycle < segments[i].startTime) {
        return i - 1;
      }
    }
    throw new Error('SHOULD NEVER REACH HERE');
  }
  function animateRocket(t: number) {
    const tCycle = t % segments[segments.length - 1].startTime;
    const activeSegmentIndex = getActiveSegment(tCycle);
    const activeSegment = segments[activeSegmentIndex];
    const endTime = segments[activeSegmentIndex + 1].startTime;
    const cycleProgress =
      (tCycle - activeSegment.startTime) / (endTime - activeSegment.startTime);

    activeSegment.update(cycleProgress, lastSegment !== activeSegment);
    if (lastSegment !== activeSegment) {
      lastSegment = activeSegment;
    }
  }

  return animateRocket;
}
