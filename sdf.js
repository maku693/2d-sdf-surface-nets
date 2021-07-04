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

export function draw(data, scene, level) {
  let edgeLength = 2 ** level;
  const cellEdgeLength = 1 / edgeLength;
  for (let v = 0; v < edgeLength; v++) {
    for (let u = 0; u < edgeLength; u++) {
      const x = (u + 0.5) * cellEdgeLength;
      const y = (v + 0.5) * cellEdgeLength;
      const i = u + edgeLength * v;
      // Shift the sampling point to center of the grid
      data[i] = Math.min(data[i], scene(x, y));
    }
  }
}
