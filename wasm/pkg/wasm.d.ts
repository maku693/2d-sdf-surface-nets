/* tslint:disable */
/* eslint-disable */
/**
* @param {Float32Array} data
* @param {number} width
* @param {number} height
* @returns {GeometryData}
*/
export function getGeometryData(data: Float32Array, width: number, height: number): GeometryData;
/**
*/
export class GeometryData {
  free(): void;
/**
* @returns {Uint16Array}
*/
  readonly indices: Uint16Array;
/**
* @returns {Float32Array}
*/
  readonly normals: Float32Array;
/**
* @returns {Float32Array}
*/
  readonly vertices: Float32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly getGeometryData: (a: number, b: number, c: number, d: number) => number;
  readonly __wbg_geometrydata_free: (a: number) => void;
  readonly geometrydata_vertices: (a: number) => number;
  readonly geometrydata_normals: (a: number) => number;
  readonly geometrydata_indices: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
