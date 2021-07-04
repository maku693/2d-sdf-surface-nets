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

export function draw(scene, data, numSamples, cellSize) {
  for (let v = 0; v < numSamples; v++) {
    for (let u = 0; u < numSamples; u++) {
      const x = (u + 0.5) * cellSize;
      const y = (v + 0.5) * cellSize;
      const i = u + numSamples * v;
      // Shift the sampling point to center of the grid
      data[i] = Math.min(data[i], scene(x, y));
    }
  }
}
