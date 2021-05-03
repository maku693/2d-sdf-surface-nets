const square_edges = [0, 1, 0, 2, 1, 3, 2, 3];

/**
 * edge_table is edges indexed by corners.
 * edges and corners are binary flag bits.
 * a bit in corners represents which corners are in the volume.
 * a bit in edges represents which edges are adjacent to the corner.
 */
const edge_table = new Uint8Array(1 << 4);
for (let i = 0; i < edge_table.length; i++) {
  let edge_mask = 0;
  for (let j = 0; j < 4; j++) {
    const a = !!(i & (1 << square_edges[j * 2]));
    const b = !!(i & (1 << square_edges[j * 2 + 1]));
    edge_mask |= a === b ? 0 : 1 << j;
  }
  edge_table[i] = edge_mask;
}

/* ---------------------------------------- */

const c = document.createElement("canvas");
document.body.appendChild(c);
c.width = 480;
c.height = 320;

const ctx = c.getContext("2d");
ctx.font = "10px monospace";
ctx.textAlign = "center";
ctx.fillStyle = "white";
ctx.fillRect(0, 0, c.width, c.height);
ctx.translate(0.5, 0.5);

for (let i = 0; i < edge_table.length; i++) {
  const edge_mask = edge_table[i];

  const x = i % 4;
  const y = parseInt(i / 4);

  ctx.strokeStyle = "black";
  ctx.strokeRect(120 * x + 45, 80 * y + 5, 30, 30);

  ctx.fillStyle = "black";
  ctx.fillText(
    `i: 0b${i.toString(2).padStart(4, "0")} (${i})`,
    120 * x + 60,
    80 * y + 50
  );
  ctx.fillText(
    `edge_mask: 0b${edge_mask.toString(2).padStart(4, "0")}`,
    120 * x + 60,
    80 * y + 65
  );

  for (let j = 0; j < 4; j++) {
    if (!(i & (1 << j))) continue;
    const px = j % 2;
    const py = parseInt(j / 2);

    ctx.fillStyle = "black";
    ctx.fillRect(
      120 * x + 45 + px * 30 - 2.5,
      80 * y + 5 + py * 30 - 2.5,
      5,
      5
    );
  }

  let edge_count = 0;
  let vx = 0;
  let vy = 0;
  for (let j = 0; j < 4; j++) {
    if (!(edge_mask & (1 << j))) continue;
    edge_count++;

    const e0 = square_edges[j * 2];
    const e1 = square_edges[j * 2 + 1];

    const e0x = e0 % 2;
    const e0y = parseInt(e0 / 2);
    const e1x = e1 % 2;
    const e1y = parseInt(e1 / 2);

    ctx.beginPath();
    ctx.moveTo(120 * x + 45 + e0x * 30, 80 * y + 5 + e0y * 30);
    ctx.lineTo(120 * x + 45 + e1x * 30, 80 * y + 5 + e1y * 30);
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.stroke();

    vx += (e0x + e1x) / 2;
    vy += (e0y + e1y) / 2;
  }

  if (edge_count === 0) continue;

  vx /= edge_count;
  vy /= edge_count;

  ctx.fillStyle = "red";
  ctx.fillRect(120 * x + 45 + vx * 30 - 1.5, 80 * y + 5 + vy * 30 - 1.5, 3, 3);
}
