import { circle, merge, render, SDFData } from "./sdf.js";

const sdfdata = new SDFData(64, 64);
const scene = merge(circle(32, 32, 16), circle(48, 48, 8));
render(sdfdata, scene);

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
