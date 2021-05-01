import { circle, merge, SDFData } from "./sdf.js";

const sdfdata = new SDFData(8, 8);
const scene = merge(circle(4, 4, 2));
sdfdata.drawDistanceFunction(scene);

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

const pixelsPerGrid = 10;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = sdfdata.width * pixelsPerGrid;
canvas.height = sdfdata.height * pixelsPerGrid;
const ctx = canvas.getContext("2d");

for (let y = 0; y < sdfdata.height; y++) {
  for (let x = 0; x < sdfdata.width; x++) {
    const i = x + sdfdata.width * y;
    const d = sdfdata.data[i];
    const r = d > 0 ? 0xff * d : 0;
    const g = d < 0 ? 0xff * -d : 0;
    console.log(r, g);
    ctx.fillStyle = `rgba(${r}, ${g}, 0, 1)`;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.rect(
      x * pixelsPerGrid,
      y * pixelsPerGrid,
      pixelsPerGrid,
      pixelsPerGrid
    );
    ctx.fill();
    ctx.stroke();
  }
}

ctx.strokeStyle = "white";

const corners = new Float32Array(4);
const gridToVertex = {};
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

    let edgeCount = 0;
    let dx = 0;
    let dy = 0;
    for (let j = 0; j < 4; j++) {
      if (!(edges & (1 << j))) continue;
      edgeCount++;

      const e0 = squareEdges[j][0];
      const e1 = squareEdges[j][1];

      const e0x = e0 % 2;
      const e0y = parseInt(e0 / 2);
      const d0 = sdfdata.data[x + e0x + (y + e0y) * sdfdata.width];

      const e1x = e1 % 2;
      const e1y = parseInt(e1 / 2);
      const d1 = sdfdata.data[x + e1x + (y + e1y) * sdfdata.width];

      dx += e0x + e1x;
      dy += e0y + e1y;
      //   console.log(d0, d1);
      //   console.log(
      //     [e0x, e1x, e0x + e1x, d0, d1, (e0x * d0 + e1x * d1) / (d0 + d1)],
      //     [e0y, e1y, e0y + e1y, d0, d1, (e0y * d0 + e1y * d1) / (d0 + d1)]
      //   );
    }

    if (edgeCount === 0) continue;

    const vx = x + dx / edgeCount;
    const vy = y + dy / edgeCount;
    // console.log(dx, dy, edgeCount);

    gridToVertex[x + y * sdfdata.width] = [vx, vy];

    if (y !== 0 && edges & 0b0001) {
      const [vx_, vy_] = gridToVertex[x + (y - 1) * sdfdata.width];
      ctx.beginPath();
      ctx.moveTo(vx * pixelsPerGrid, vy * pixelsPerGrid);
      ctx.lineTo(vx_ * pixelsPerGrid, vy_ * pixelsPerGrid);
      ctx.stroke();
    }
    if (x !== 0 && edges & 0b0010) {
      const [vx_, vy_] = gridToVertex[x - 1 + y * sdfdata.width];
      ctx.beginPath();
      ctx.moveTo(vx * pixelsPerGrid, vy * pixelsPerGrid);
      ctx.lineTo(vx_ * pixelsPerGrid, vy_ * pixelsPerGrid);
      ctx.stroke();
    }
  }
}

canvas.addEventListener("mousemove", (e) => {
  //   if (e.buttons !== 1) return;
  //   sdfdata.drawDistanceFunction(circle(e.offsetX, e.offsetY, 4));
  //   draw();
});
