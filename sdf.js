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

export function draw(scene, data, levels) {
  let offset = 0;
  for (let level = 0; level < levels; level++) {
    const numSamples = 2 ** (level + 1);
    const cellSize = 1 / numSamples;
    for (let v = 0; v < numSamples; v++) {
      for (let u = 0; u < numSamples; u++) {
        const i = offset + u + numSamples * v;
        // Shift the sampling point to center of the grid
        const x = (u + 0.5) * cellSize;
        const y = (v + 0.5) * cellSize;
        data[i] = Math.min(data[i], scene(x, y));
      }
    }
    offset += numSamples ** 2;
  }
}
