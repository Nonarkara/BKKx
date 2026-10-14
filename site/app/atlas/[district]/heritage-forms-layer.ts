// MapLibre custom layer that draws the Old Town's Thai forms with three.js.
// Loaded only when the atlas zooms into Rattanakosin with Old Town 3D on
// (AtlasView imports this module lazily), so three.js never reaches a
// visitor who stays at city scale.
//
// One merged mesh, one material, vertex colours, Lambert light. The specs
// come from /data/bkk-heritage-forms.json; the shapes from heritage-forms.ts.
import * as THREE from "three";
import type maplibregl from "maplibre-gl";
import { buildForm, ORIGIN, type FormSpec } from "./heritage-forms";

export const FORMS_LAYER_ID = "bkkx-heritage-forms";

export function createFormsLayer(ml: typeof maplibregl, forms: FormSpec[]): maplibregl.CustomLayerInterface {
  const origin = ml.MercatorCoordinate.fromLngLat([ORIGIN.lng, ORIGIN.lat], 0);
  const s = origin.meterInMercatorCoordinateUnits();
  // Local metres (x east, y north, z up) → Mercator (y grows south).
  const model = new THREE.Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new THREE.Vector3(s, -s, s));

  let renderer: THREE.WebGLRenderer | null = null;
  let map: maplibregl.Map | null = null;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  // Build once. ~70k triangles for the island.
  const positions: number[] = [];
  const colors: number[] = [];
  for (const f of forms) {
    const m = buildForm(f);
    for (const v of m.positions) positions.push(v);
    for (const c of m.colors) colors.push(c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  // Faces are wound both ways and the Mercator flip mirrors them; draw both sides.
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(geometry, material));
  // Late-afternoon light from the south-west — the Chao Phraya side.
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
  sun.position.set(-0.6, -0.8, 1.2).normalize();
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x3a3326, 1.1));

  return {
    id: FORMS_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(m, gl) {
      map = m;
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
    },
    render(_gl, matrix) {
      if (!renderer || !map) return;
      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix as number[]).multiply(model);
      renderer.resetState();
      renderer.render(scene, camera);
    },
    onRemove() {
      geometry.dispose();
      material.dispose();
      renderer = null;
      map = null;
    },
  };
}
