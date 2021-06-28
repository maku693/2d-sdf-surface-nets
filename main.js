import { circle, merge, SDFData } from "./sdf.js";

const edgeCorners = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/**
 * edgeBitFields is edges indexed by corners.
 * edges and corners are binary flag bits.
 * a bit in corners represents which corners are in the volume.
 * a bit in edges represents which edges are adjacent to the corner.
 */
const edgeBitFields = new Uint8Array(1 << 4);
{
  for (let i = 0; i < edgeBitFields.length; i++) {
    let edges = 0;
    for (let j = 0; j < 4; j++) {
      const a = !!(i & (1 << edgeCorners[j][0]));
      const b = !!(i & (1 << edgeCorners[j][1]));
      edges |= a === b ? 0 : 1 << j;
    }
    edgeBitFields[i] = edges;
  }
}

const sdfdata = new SDFData(8);
const scene = merge(
  circle(sdfdata.width / 2, sdfdata.height / 2, sdfdata.width / 4)
  // circle(sdfdata.width / 4, sdfdata.height / 2, sdfdata.width / 16),
  // circle((sdfdata.width / 4) * 3, sdfdata.height / 2, sdfdata.width / 16)
);
sdfdata.drawDistanceFunction(scene);

const pixelsPerGrid = 20;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.style.width = `${sdfdata.width * pixelsPerGrid}px`;
canvas.style.height = `${sdfdata.height * pixelsPerGrid}px`;
canvas.width = sdfdata.width * pixelsPerGrid * window.devicePixelRatio;
canvas.height = sdfdata.height * pixelsPerGrid * window.devicePixelRatio;
const ctx = canvas.getContext("2d");
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

{
  for (let y = 0; y < sdfdata.height; y++) {
    for (let x = 0; x < sdfdata.width; x++) {
      const i = x + sdfdata.width * y;
      const d = sdfdata.data[i];
      const r = d > 0 ? 0xff * d : 0;
      const g = d < 0 ? 0xff * -d : 0;
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
      ctx.fillStyle = "white";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = `${pixelsPerGrid / 2 - 1}px monospace`;
      ctx.fillText(
        `${d.toFixed(1)}`,
        x * pixelsPerGrid + pixelsPerGrid / 2,
        y * pixelsPerGrid + pixelsPerGrid / 2
      );
    }
  }
}

ctx.lineWidth = 2;

const vertices = [];
const normals = [];
const indices = [];
const gridIndices = {};

for (let y = 0; y < sdfdata.height - 1; y++) {
  for (let x = 0; x < sdfdata.width - 1; x++) {
    let cornerMask = 0;
    for (let v = 0; v < 2; v++) {
      for (let u = 0; u < 2; u++) {
        const d = sdfdata.data[x + u + (y + v) * sdfdata.width];
        const i = u + v * 2;
        cornerMask |= (0 < d) << i;
      }
    }

    const edges = edgeBitFields[cornerMask];

    let numEdges = 0;
    let d = [0, 0];
    for (let i = 0; i < 4; i++) {
      if (!(edges & (1 << i))) continue;
      numEdges++;

      const dataIndices = [0, 0];
      const uv = [
        [0, 0],
        [0, 0],
      ];
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          uv[j][k] = (edgeCorners[i][j] >> k) & 1;
        }
        dataIndices[j] = x + uv[j][0] + (y + uv[j][1]) * sdfdata.width;
      }
      const t =
        (0 - sdfdata.data[dataIndices[0]]) /
        (sdfdata.data[dataIndices[1]] - sdfdata.data[dataIndices[0]]);
      for (let j = 0; j < 2; j++) {
        d[j] += lerp(uv[0][j], uv[1][j], t);
      }
    }

    if (numEdges === 0) continue;

    gridIndices[x + y * sdfdata.width] = vertices.length / 2;

    // Shift vertex to center of the grid
    vertices.push(x + 0.5 + d[0] / numEdges, y + 0.5 + d[1] / numEdges);

    const surrounds = [];
    for (let i = 0; i < 4; i++) {
      const u = i & 1;
      const v = (i >> 1) & 1;
      surrounds[i] = sdfdata.data[x + u + (y + v) * sdfdata.width];
    }
    normals.push(
      (surrounds[1] - surrounds[0] + surrounds[3] - surrounds[2]) / 2,
      (surrounds[2] - surrounds[0] + surrounds[3] - surrounds[1]) / 2
    );

    if (edges & 0b0001) {
      indices.push(
        gridIndices[x + y * sdfdata.width],
        gridIndices[x + (y - 1) * sdfdata.width]
      );
    }
    if (edges & 0b0010) {
      indices.push(
        gridIndices[x + y * sdfdata.width],
        gridIndices[x - 1 + y * sdfdata.width]
      );
    }
  }
}

for (let i = 0; i < indices.length / 2; i++) {
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(
    vertices[indices[i * 2 + 0] * 2 + 0] * pixelsPerGrid,
    vertices[indices[i * 2 + 0] * 2 + 1] * pixelsPerGrid
  );
  ctx.lineTo(
    vertices[indices[i * 2 + 1] * 2 + 0] * pixelsPerGrid,
    vertices[indices[i * 2 + 1] * 2 + 1] * pixelsPerGrid
  );
  ctx.stroke();
}

for (let i = 0; i < vertices.length / 2; i++) {
  ctx.strokeStyle = "cyan";
  ctx.beginPath();
  ctx.moveTo(
    vertices[i * 2 + 0] * pixelsPerGrid,
    vertices[i * 2 + 1] * pixelsPerGrid
  );
  ctx.lineTo(
    (vertices[i * 2 + 0] + normals[i * 2 + 0]) * pixelsPerGrid,
    (vertices[i * 2 + 1] + normals[i * 2 + 1]) * pixelsPerGrid
  );
  ctx.stroke();
}

// y = y1 + (y2 - y1) / (x2 - x1) * (x - x1)
// y = y1 + (y2 - y1) / (x2 - x1) * (x - x1)
// ex.)
//// x1 = 1
//// x = 1.5
//// x2 = 2
//// t = 0.5
//// t = (1.5 - 1) / (2 - 1)
// t = (x - x1) / (x2 - x1)
// y = y1 + (y2 - y1) * t
// y = y1 + t * (y2 - y1) -> (1 - t) * y1 + t * y2
// y = y1 + t * y2 - t * y1
// y = y1 - t * y1 + t * y2
// y = (1 - t) * y1 + t * y2
function lerp(x, y, a) {
  return x * (1.0 - a) + y * a;
}
