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

export function draw(width, height, data, scene) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = x + width * y;
      // Shift the sampling point to center of the grid
      data[i] = Math.min(data[i], scene(x + 0.5, y + 0.5));
    }
  }
}
