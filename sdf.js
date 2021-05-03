export function merge(...ff) {
  return function (x, y) {
    return Math.min(...ff.map((f) => f(x, y)));
  };
}

export function circle(cx, cy, r) {
  return function (x, y) {
    return Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2)) - r;
  };
}

export class SDFData {
  constructor(width, height, data) {
    this.width = width;
    this.height = height || this.width;
    this.data =
      data || new Float32Array(this.width * this.height).fill(Infinity);
  }
  drawDistanceFunction(f) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = x + this.width * y;
        // Shift the sampling point to center of the grid
        const x_ = x + 0.5,
          y_ = y + 0.5;
        this.data[i] = Math.min(this.data[i], f(x_, y_));
      }
    }
  }
}
