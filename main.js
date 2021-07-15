import { circle, draw as drawSDF, merge } from "./sdf.js";
import { getGeometryData as getGeometryDataJS } from "./surface-nets.js";
import init, {
  getGeometryData as getGeometryDataWASM,
} from "./wasm/pkg/wasm.js";

(async function main() {
  await init();

  const width = 16;
  const height = width;
  const data = new Float32Array(width * height).fill(Infinity);

  const scene = merge(
    circle(width / 2, height / 2, width / 4)
    // circle(width / 4, height / 2, width / 16),
    // circle((width / 4) * 3, height / 2, width / 16)
  );

  const samples = 10;
  {
    const begin = performance.now();
    for (let i = 0; i < samples; i++) {
      drawSDF(width, height, data, scene);
    }
    const time = (performance.now() - begin) / samples;
    document.getElementById("time_draw").textContent = `${time} ms`;
  }

  let getGeometryData;
  const isWASM = new URL(location.href).searchParams.get("wasm") === "true";
  if (isWASM) {
    getGeometryData = getGeometryDataWASM;
  } else {
    getGeometryData = getGeometryDataJS;
  }
  document.getElementById("form_wasm").checked = isWASM;

  let geometryData;
  {
    const begin = performance.now();
    for (let i = 0; i < samples; i++) {
      geometryData = getGeometryData(data, width, height);
    }
    const time = (performance.now() - begin) / samples;
    document.getElementById("time_getGeometryData").textContent = `${time} ms`;
  }
  const { vertices, normals, indices } = geometryData;

  const pixelsPerGrid = 20;
  const canvas = document.getElementById("canvas");
  canvas.style.width = `${width * pixelsPerGrid}px`;
  canvas.style.height = `${height * pixelsPerGrid}px`;
  canvas.width = width * pixelsPerGrid;
  canvas.height = height * pixelsPerGrid;
  const ctx = canvas.getContext("2d");

  let mouseEvent;
  function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = x + width * y;
        const d = data[i];
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
        ctx.font = `${pixelsPerGrid * 0.4}px monospace`;
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

    if (mouseEvent) {
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(mouseEvent.offsetX, mouseEvent.offsetY);
      ctx.lineTo(width * 0.5 * pixelsPerGrid, height * 0.5 * pixelsPerGrid);
      ctx.stroke();
    }
  }

  canvas.addEventListener("mousemove", (e) => {
    mouseEvent = e;
    draw();
  });
})();
