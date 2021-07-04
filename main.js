import { circle, draw, merge } from "./sdf.js";
import { getGeometryData as getGeometryDataJS } from "./surface-nets.js";
import init, {
  getGeometryData as getGeometryDataWASM,
} from "./wasm/pkg/wasm.js";

(async function main() {
  await init();

  const level = 4;
  const numSamples = 2 ** level;
  const cellSize = 1 / numSamples;

  const data = new Float32Array(numSamples ** 2).fill(Infinity);
  const scene = merge(circle(0.5, 0.5, 0.25));

  draw(scene, data, numSamples, cellSize);

  let getGeometryData;

  const url = new URL(location.href);
  const isWASM = url.searchParams.get("wasm") === "✔";
  if (isWASM) {
    getGeometryData = getGeometryDataWASM;
  } else {
    getGeometryData = getGeometryDataJS;
  }
  document.getElementById("form_wasm").checked = isWASM;
  const samples = 10;
  const begin = performance.now();
  let geometryData;
  for (let i = 0; i < samples; i++) {
    geometryData = getGeometryData(data, numSamples, numSamples);
  }
  const time = (performance.now() - begin) / samples;
  document.getElementById("time").textContent = `${time} ms`;

  const { vertices, normals, indices } = geometryData;

  const pixelsPerCell = 40;
  const canvas = document.getElementById("canvas");
  canvas.style.width = canvas.style.height = `${
    numSamples * pixelsPerCell * 0.5
  }px`;
  canvas.width = canvas.height =
    numSamples * pixelsPerCell * window.devicePixelRatio;
  const ctx = canvas.getContext("2d");
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < numSamples; y++) {
    for (let x = 0; x < numSamples; x++) {
      const i = x + numSamples * y;
      const d = data[i];
      const r = d > 0 ? 0xff * d : 0;
      const g = d < 0 ? 0xff * -d : 0;
      ctx.fillStyle = `rgba(${r}, ${g}, 0, 1)`;
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.rect(
        x * pixelsPerCell,
        y * pixelsPerCell,
        pixelsPerCell,
        pixelsPerCell
      );
      ctx.fill();
      ctx.stroke();
      if (Math.abs(d) < cellSize) {
        ctx.fillStyle = "yellow";
      } else {
        ctx.fillStyle = "white";
      }
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = `${pixelsPerCell * 0.25}px monospace`;
      ctx.fillText(
        `${d.toFixed(3)}`,
        x * pixelsPerCell + pixelsPerCell / 2,
        y * pixelsPerCell + pixelsPerCell / 2
      );
    }
  }

  ctx.lineWidth = 1;

  for (let i = 0; i < indices.length / 2; i++) {
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(
      vertices[indices[i * 2 + 0] * 2 + 0] * pixelsPerCell,
      vertices[indices[i * 2 + 0] * 2 + 1] * pixelsPerCell
    );
    ctx.lineTo(
      vertices[indices[i * 2 + 1] * 2 + 0] * pixelsPerCell,
      vertices[indices[i * 2 + 1] * 2 + 1] * pixelsPerCell
    );
    ctx.stroke();
  }

  for (let i = 0; i < vertices.length / 2; i++) {
    ctx.strokeStyle = "cyan";
    ctx.beginPath();
    ctx.moveTo(
      vertices[i * 2 + 0] * pixelsPerCell,
      vertices[i * 2 + 1] * pixelsPerCell
    );
    ctx.lineTo(
      (vertices[i * 2 + 0] + normals[i * 2 + 0]) * pixelsPerCell,
      (vertices[i * 2 + 1] + normals[i * 2 + 1]) * pixelsPerCell
    );
    ctx.stroke();
  }
})();
