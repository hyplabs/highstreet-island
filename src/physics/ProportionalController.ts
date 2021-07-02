export let MAX_DT = (1 / 60.0) * 1.2;
export let MAX_DT_EVER = 1;
export let PHYS_EPSILON = 0.0001;

export class ProportionalController {
  K: number;
  damp: number;

  _v: number = 0;
  _x: number = 0;

  active: boolean = false;

  getCurrent() {
    return this._x;
  }

  setDesired(desired: number) {
    this._desired = desired;
    this.active = true;
  }

  _desired: number = this._x;
  // avgError: SlidingAverageWindow = new SlidingAverageWindow(0.5);

  constructor(K: number, damp: number, initial: number = 0) {
    this.K = K;
    this._x = initial;
    this._desired = initial;
    this.damp = damp;
  }

  step(dt: number): number {
    if (this.active) {
      if (dt > MAX_DT_EVER) {
        //can happen if user switches tabs for example
        this._x = this._desired;
        this._v = 0;
        return this._desired;
      }

      //take multiple steps if necessary
      let origDt;
      if (dt > MAX_DT) {
        origDt = dt;
        dt = MAX_DT;
      }

      let error = this._desired - this._x;
      let correctiveAction = error * this.K;
      this._x += this._v * dt;
      this._v += (correctiveAction + -this.damp * this._v) * dt;

      if (
        Math.abs(this._x) < PHYS_EPSILON &&
        Math.abs(this._v) < PHYS_EPSILON
      ) {
        this.active = false;
      }

      if (origDt) {
        return this.step(origDt - MAX_DT);
      }
    }
    return this._x;
  }
}
