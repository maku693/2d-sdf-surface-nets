use js_sys::{Float32Array, Uint16Array};
use nohash_hasher::IntMap;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

const EDGE_CORNERS: [[u8; 2]; 4] = [[0, 1], [0, 2], [1, 3], [2, 3]];

const EDGE_BIT_FIELDS: [u8; 16] = {
  let mut s = [0; 16];
  let mut i = 0;
  while i < s.len() {
    let mut edges: u8 = 0;
    let mut j = 0;
    while j < 4 {
      let a = i & (1 << EDGE_CORNERS[j][0]) > 0;
      let b = i & (1 << EDGE_CORNERS[j][1]) > 0;
      if a != b {
        edges |= 1 << j;
      }
      j += 1
    }
    s[i] = edges;
    i += 1
  }
  s
};

#[wasm_bindgen(js_name = getGeometryData)]
pub fn get_geometry_data(data: &[f32], width: u16, height: u16) -> GeometryData {
  let mut vertices = Vec::<f32>::new();
  let mut normals = Vec::<f32>::new();
  let mut indices = Vec::<u16>::new();
  let mut grid_indices = IntMap::<u16, u16>::default();

  for y in 0..width - 1 {
    for x in 0..height - 1 {
      let mut corner_mask = 0u8;
      {
        let mut i = 0;
        for v in 0..2 {
          for u in 0..2 {
            let d = data
              .get(usize::from(x + u + (y + v) * width))
              .cloned()
              .unwrap_or_default();
            if d > 0. {
              corner_mask |= 1 << i;
            }
            i += 1;
          }
        }
      }
      let edges = EDGE_BIT_FIELDS[usize::from(corner_mask)];
      let mut num_edges: u8 = 0;
      let mut delta = [0., 0.];
      for i in 0..4 {
        if edges & (1 << i) == 0 {
          continue;
        }
        num_edges += 1;
        let mut indices = [0, 0];
        let mut uv = [[0, 0], [0, 0]];
        for j in 0..2 {
          for k in 0..2 {
            uv[j][k] = (EDGE_CORNERS[i][j] >> k & 1).into();
          }
          indices[j] = (x + uv[j][0] + (y + uv[j][1]) * width).into();
        }
        let d0 = data.get(indices[0]).cloned().unwrap_or_default();
        let d1 = data.get(indices[1]).cloned().unwrap_or_default();
        let t = (0. - d0) / (d1 - d0);
        for j in 0..2 {
          delta[j] += lerp(uv[0][j].into(), uv[1][j].into(), t);
        }
      }

      if num_edges == 0 {
        continue;
      }

      let grid_index = u16::try_from(vertices.len() / 2).unwrap_or_default();
      grid_indices.insert(x + y * width, grid_index);

      {
        let num_edges = f32::from(num_edges);
        vertices.push(f32::from(x) + 0.5 + delta[0] / num_edges);
        vertices.push(f32::from(y) + 0.5 + delta[1] / num_edges);
      }

      let mut surrounds = [0., 0., 0., 0.];
      for i in 0..4 {
        surrounds[i] = {
          let u = u16::try_from(i & 1).unwrap_or_default();
          let v = u16::try_from((i >> 1) & 1).unwrap_or_default();
          data
            .get(usize::from(x + u + (y + v) * width))
            .cloned()
            .unwrap_or_default()
        }
      }
      normals.push((surrounds[1] - surrounds[0] + surrounds[3] - surrounds[2]) / 2.);
      normals.push((surrounds[2] - surrounds[0] + surrounds[3] - surrounds[1]) / 2.);

      if y != 0 && edges & 0b0001 > 0 {
        indices.push(grid_index);
        indices.push(
          grid_indices
            .get(&(x + (y - 1) * width))
            .cloned()
            .unwrap_or_default(),
        );
      }
      if x != 0 && edges & 0b0010 > 0 {
        indices.push(grid_index);
        indices.push(
          grid_indices
            .get(&(x - 1 + y * width))
            .cloned()
            .unwrap_or_default(),
        );
      }
    }
  }

  GeometryData {
    vertices,
    normals,
    indices,
  }
}

#[inline]
fn lerp(x: f32, y: f32, a: f32) -> f32 {
  return x * (1.0 - a) + y * a;
}

#[wasm_bindgen]
pub struct GeometryData {
  vertices: Vec<f32>,
  normals: Vec<f32>,
  indices: Vec<u16>,
}

#[wasm_bindgen]
impl GeometryData {
  #[wasm_bindgen(getter)]
  pub fn vertices(&self) -> Float32Array {
    return self.vertices[..].into();
  }
  #[wasm_bindgen(getter)]
  pub fn normals(&self) -> Float32Array {
    return self.normals[..].into();
  }

  #[wasm_bindgen(getter)]
  pub fn indices(&self) -> Uint16Array {
    return self.indices[..].into();
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_lerp() {
    assert_eq!(0.5, lerp(0., 1., 0.5));
    assert_eq!(1.2, lerp(1., 2., 0.2));
    assert_eq!(-1.3, lerp(-2., -1., 0.7));
  }

  #[test]
  fn test_get_geometry_data() {
    let data = [
      0.6642135381698608f32,
      0.25,
      0.6642135381698608,
      0.25,
      -0.75,
      0.25,
      0.6642135381698608,
      0.25,
      0.664213538169860,
    ];
    let geometry_data = get_geometry_data(&data, 3, 3);
    assert_eq!(
      geometry_data.vertices,
      vec![1.125f32, 1.125, 1.875, 1.125, 1.125, 1.875, 1.875, 1.875],
    );
    assert_eq!(
      geometry_data.normals,
      vec![
        -0.7071067690849304f32,
        -0.7071067690849304,
        0.7071067690849304,
        -0.7071067690849304,
        -0.7071067690849304,
        0.7071067690849304,
        0.7071067690849304,
        0.7071067690849304,
      ]
    );
    assert_eq!(geometry_data.indices, vec![1, 0, 2, 0, 3, 1, 3, 2]);
  }
}
