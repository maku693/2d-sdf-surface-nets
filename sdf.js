export function merge(...ff) {
  return function (x, y) {
    let res = Infinity;
    for (const f of ff) {
      const tmp = f(x, y);
      if (tmp < res) {
        res = tmp;
      }
    }
    return res;
  };
}

export function circle(cx, cy, r) {
  return function (x, y) {
    return Math.pow(x - cx, 2) + Math.pow(y - cy, 2) - Math.pow(r, 2);
  };
}

export function superEllipse(cx, cy, a, b, n) {
  return function (x, y) {
    return (
      Math.pow(Math.abs(x - cx) / a, n) + Math.pow(Math.abs(y - cy) / b, n) - 1
    );
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
