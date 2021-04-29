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
}

export function render(sdfdata, f) {
  for (let y = 0; y < sdfdata.height; y++) {
    for (let x = 0; x < sdfdata.width; x++) {
      const i = x + sdfdata.width * y;
      sdfdata.data[i] = f(x, y);
    }
  }
}
