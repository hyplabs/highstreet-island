// main class for managing animations

import { removeFromArray } from './util/removeFromArray';

export interface Animateable {
  update: (dt: number, elapsed: number) => void;
}

export class Puppeteer {
  animateables: Animateable[] = [];
  addAnimation(animateable: Animateable) {
    this.animateables.push(animateable);
  }
  removeAnimation(animateable: Animateable) {
    removeFromArray(this.animateables, animateable);
  }
  render(dt: number, elapsed: number) {
    for (let i = 0; i < this.animateables.length; i++) {
      const a = this.animateables[i];
      a.update(dt, elapsed);
    }
  }
}
