import { circle, merge, SDFData } from "./sdf.js";

const sdfdata = new SDFData(32, 32);
const scene = merge(circle(16, 16, 8), circle(24, 24, 4));
sdfdata.drawDistanceFunction(scene);

{
  // Debug view
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.width = sdfdata.width;
  canvas.height = sdfdata.height;
  const ctx = canvas.getContext("2d");
  const imagedata = ctx.getImageData(0, 0, sdfdata.width, sdfdata.height);
  for (let y = 0; y < sdfdata.height; y++) {
    for (let x = 0; x < sdfdata.width; x++) {
      const i = x + sdfdata.width * y;
      const d = sdfdata.data[i];
      imagedata.data[i * 4 + 0] = d > 0 ? 0xff * d : 0; // R
      imagedata.data[i * 4 + 1] = d < 0 ? 0xff * -d : 0; // G
      imagedata.data[i * 4 + 2] = 0; // B
      imagedata.data[i * 4 + 3] = 0xff; // A
    }
  }
  ctx.putImageData(imagedata, 0, 0);
}

const squareEdges = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/**
 * cornersToEdges is edges indexed by corners.
 * edges and corners are binary flag bits.
 * a bit in corners represents which corners are in the volume.
 * a bit in edges represents which edges are adjacent to the corner.
 */
const cornersToEdges = new Uint8Array(1 << 4);
{
  for (let i = 0; i < cornersToEdges.length; i++) {
    let edges = 0;
    for (let j = 0; j < 4; j++) {
      const a = !!(i & (1 << squareEdges[j][0]));
      const b = !!(i & (1 << squareEdges[j][1]));
      edges |= a === b ? 0 : 1 << j;
    }
    cornersToEdges[i] = edges;
  }
}

const pixelsPerGrid = 8;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = sdfdata.width * pixelsPerGrid;
canvas.height = sdfdata.height * pixelsPerGrid;
const ctx = canvas.getContext("2d");

const corners = new Float32Array(4);
for (let y = 0; y < sdfdata.height - 1; y++) {
  for (let x = 0; x < sdfdata.width - 1; x++) {
    let cornerMask = 0;
    for (let v = 0; v < 2; v++) {
      for (let u = 0; u < 2; u++) {
        const d = sdfdata.data[x + u + (y + v) * sdfdata.width];
        const i = u + v * 2;
        corners[i] = d;
        cornerMask |= (0 < d) << i;
      }
    }

    const edges = cornersToEdges[cornerMask];
    if (!edges) {
      ctx.fillStyle = "lightgray";
      ctx.fillRect(x * pixelsPerGrid + 8 - 4, y * pixelsPerGrid + 8 - 4, 8, 8);
      continue;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(x * pixelsPerGrid + 8 - 4, y * pixelsPerGrid + 8 - 4, 8, 8);
  }
}

canvas.addEventListener("mousemove", (e) => {
  //   if (e.buttons !== 1) return;
  //   sdfdata.drawDistanceFunction(circle(e.offsetX, e.offsetY, 4));
  //   draw();
});
