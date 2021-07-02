import { circle, merge, SDFData } from "./sdf.js";
import { getGeometryData as getGeometryDataJS } from "./surface-nets.js";
import init, {
  getGeometryData as getGeometryDataWASM,
} from "./wasm/pkg/wasm.js";

(async function main() {
  await init();

  const sdfdata = new SDFData(64);
  const scene = merge(
    circle(sdfdata.width / 2, sdfdata.height / 2, sdfdata.width / 4)
    // circle(sdfdata.width / 4, sdfdata.height / 2, sdfdata.width / 16),
    // circle((sdfdata.width / 4) * 3, sdfdata.height / 2, sdfdata.width / 16)
  );
  sdfdata.drawDistanceFunction(scene);

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
    geometryData = getGeometryData(sdfdata.data, sdfdata.width, sdfdata.height);
  }
  const time = (performance.now() - begin) / samples;
  document.getElementById("time").textContent = `${time} ms`;

  const { vertices, normals, indices } = geometryData;

  const pixelsPerGrid = 5;
  const canvas = document.getElementById("canvas");
  canvas.style.width = `${sdfdata.width * pixelsPerGrid}px`;
  canvas.style.height = `${sdfdata.height * pixelsPerGrid}px`;
  canvas.width = sdfdata.width * pixelsPerGrid * window.devicePixelRatio;
  canvas.height = sdfdata.height * pixelsPerGrid * window.devicePixelRatio;
  const ctx = canvas.getContext("2d");
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  ctx.lineWidth = 1;

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
})();
