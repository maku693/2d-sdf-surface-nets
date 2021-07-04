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

export function getGeometryData(data, width, height) {
  const vertices = [];
  const normals = [];
  const indices = [];
  const gridIndices = {};

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      let cornerMask = 0;
      for (let v = 0; v < 2; v++) {
        for (let u = 0; u < 2; u++) {
          const d = data[x + u + (y + v) * width];
          const i = u + v * 2;
          cornerMask |= (0 < d) << i;
        }
      }

      const edges = edgeBitFields[cornerMask];

      let numEdges = 0;
      let d = [0, 0];
      for (let i = 0; i < 4; i++) {
        if ((edges & (1 << i)) == 0) continue;
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
          dataIndices[j] = x + uv[j][0] + (y + uv[j][1]) * width;
        }
        const t =
          (0 - data[dataIndices[0]]) /
          (data[dataIndices[1]] - data[dataIndices[0]]);
        for (let j = 0; j < 2; j++) {
          d[j] += lerp(uv[0][j], uv[1][j], t);
        }
      }

      if (numEdges === 0) continue;

      gridIndices[x + y * width] = vertices.length / 2;

      // Shift vertex to center of the grid
      vertices.push(x + 0.5 + d[0] / numEdges, y + 0.5 + d[1] / numEdges);

      const surrounds = [];
      for (let i = 0; i < 4; i++) {
        const u = i & 1;
        const v = (i >> 1) & 1;
        surrounds[i] = data[x + u + (y + v) * width];
      }

      const a = surrounds[1] - surrounds[0] + surrounds[3] - surrounds[2];
      const b = surrounds[2] - surrounds[0] + surrounds[3] - surrounds[1];
      const magnitude = Math.sqrt(a * a + b * b);
      normals.push(a / magnitude, b / magnitude);

      if (edges & 0b0001) {
        indices.push(
          gridIndices[x + y * width],
          gridIndices[x + (y - 1) * width]
        );
      }
      if (edges & 0b0010) {
        indices.push(
          gridIndices[x + y * width],
          gridIndices[x - 1 + y * width]
        );
      }
    }
  }

  return {
    vertices,
    normals,
    indices,
  };
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
