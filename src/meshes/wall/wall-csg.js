import * as BABYLON from 'babylonjs';
import { Colors, Shapes } from './key';

export function create(scene, tileSize, doorColor) {
  const pbr = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  pbr.baseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
  pbr.metallic = 0.95;
  pbr.roughness = 0.4;

  // height of the wall
  const h = 1;
  // width and depth (should remain at 1 = full tile)
  const w = 1;
  // amount to shave off the top
  const shaveAmount = 0.1;
  // amount to chop off the corners (more than 0.85 chops nothing)
  const chopAmount = 0.85;

  const mesh1 = BABYLON.MeshBuilder.CreateBox('', { height: h, width: w, depth: w });
  mesh1.setEnabled(false);

  const m1 = BABYLON.MeshBuilder.CreateBox('', { height: shaveAmount, width: w + 1, depth: shaveAmount });
  const m2 = BABYLON.MeshBuilder.CreateCylinder('', { height: w + 1, diameter: shaveAmount * 2, tessellation: 96 });
  m2.rotation.z = Math.PI / 2;
  m2.position.y = -shaveAmount / 2;
  m2.position.z = shaveAmount / 2;
  m1.setEnabled(false);
  m2.setEnabled(false);

  const csg0 = BABYLON.CSG.FromMesh(mesh1);
  const csg1 = BABYLON.CSG.FromMesh(m1);
  const csg2 = BABYLON.CSG.FromMesh(m2);
  const shave = csg1.subtract(csg2).toMesh();
  shave.setEnabled(false);

  mesh1.dispose();
  m1.dispose();
  m2.dispose();

  const m3 = shave.clone();
  m3.position.y = h / 2 - shaveAmount / 2;
  m3.position.z = -w / 2 + shaveAmount / 2;
  const m4 = shave.clone();
  m4.rotation.y = Math.PI;
  m4.position.y = h / 2 - shaveAmount / 2;
  m4.position.z = w / 2 - shaveAmount / 2;
  const m5 = shave.clone();
  m5.rotation.y = -Math.PI / 2;
  m5.position.y = h / 2 - shaveAmount / 2;
  m5.position.x = w / 2 - shaveAmount / 2;
  const m6 = shave.clone();
  m6.rotation.y = Math.PI / 2;
  m6.position.y = h / 2 - shaveAmount / 2;
  m6.position.x = -w / 2 + shaveAmount / 2;

  const corner = BABYLON.MeshBuilder.CreateBox('', { height: h + 1, width: 1, depth: 1 });
  corner.setEnabled(false);
  corner.rotation.y = Math.PI / 4;

  const m10 = corner.clone();
  m10.position.x = -chopAmount;
  m10.position.z = -chopAmount;
  const m11 = corner.clone();
  m11.position.x = -chopAmount;
  m11.position.z = chopAmount;
  const m12 = corner.clone();
  m12.position.x = chopAmount;
  m12.position.z = -chopAmount;
  const m13 = corner.clone();
  m13.position.x = chopAmount;
  m13.position.z = chopAmount;

  let csg = csg0
    .subtract(BABYLON.CSG.FromMesh(m3))
    .subtract(BABYLON.CSG.FromMesh(m4))
    .subtract(BABYLON.CSG.FromMesh(m5))
    .subtract(BABYLON.CSG.FromMesh(m6))
    .subtract(BABYLON.CSG.FromMesh(m10))
    .subtract(BABYLON.CSG.FromMesh(m11))
    .subtract(BABYLON.CSG.FromMesh(m12))
    .subtract(BABYLON.CSG.FromMesh(m13));
  let wall = csg.toMesh('wall', pbr, scene);

  shave.dispose();
  corner.dispose();
  m3.dispose();
  m4.dispose();
  m5.dispose();
  m6.dispose();
  m10.dispose();
  m11.dispose();
  m12.dispose();
  m13.dispose();

  if (doorColor) {
    const handle1 = BABYLON.Mesh.CreateTorus('', 0.3, 0.06, Shapes[doorColor]);
    handle1.rotation.x = Math.PI / 2;
    handle1.setEnabled(false);
    const handle2 = handle1.clone();
    const handle3 = handle1.clone();
    const handle4 = handle1.clone();
    handle1.position.z = -w / 2;
    handle2.position.z = w / 2;
    handle3.rotation.y = Math.PI / 2;
    handle3.position.x = w / 2;
    handle4.rotation.y = Math.PI / 2;
    handle4.position.x = -w / 2;

    const indentMaterial = new BABYLON.StandardMaterial('material', scene);
    indentMaterial.diffuseColor = Colors[doorColor];
    const keyPbr = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
    keyPbr.baseColor = Colors[doorColor];
    keyPbr.metallic = 1.0;
    keyPbr.roughness = 0.4;
    const multiMat = new BABYLON.MultiMaterial('multiMat', scene);
    multiMat.subMaterials.push(pbr, pbr, pbr, pbr, pbr,
      indentMaterial, indentMaterial, indentMaterial, indentMaterial,
      keyPbr, keyPbr, keyPbr, keyPbr);

    const i1 = BABYLON.MeshBuilder.CreateCylinder('', { height: w + 1, diameter: w / 2, tessellation: 16 });
    i1.setEnabled(false);
    i1.rotation.x = Math.PI / 2;
    const i2 = i1.clone();
    i2.rotation.y = Math.PI / 2;
    const i3 = BABYLON.MeshBuilder.CreateBox('', { height: h / 2, width: w / 2, depth: w + 1 });
    i3.setEnabled(false);
    i3.position.y = -h / 4;
    const i4 = i3.clone();
    i4.rotation.y = Math.PI / 2;

    const d1 = BABYLON.MeshBuilder.CreateCylinder('', { height: w - 0.1, diameter: w / 2, tessellation: 16 });
    d1.setEnabled(false);
    d1.rotation.x = Math.PI / 2;
    const d2 = d1.clone();
    d2.rotation.y = Math.PI / 2;
    const d3 = BABYLON.MeshBuilder.CreateBox('', { height: h / 2, width: w / 2, depth: w - 0.1 });
    d3.setEnabled(false);
    d3.position.y = -h / 4;
    const d4 = d3.clone();
    d4.rotation.y = Math.PI / 2;

    csg = BABYLON.CSG.FromMesh(wall)
      .subtract(BABYLON.CSG.FromMesh(i1))
      .subtract(BABYLON.CSG.FromMesh(i2))
      .subtract(BABYLON.CSG.FromMesh(i3))
      .subtract(BABYLON.CSG.FromMesh(i4))
      .union(BABYLON.CSG.FromMesh(d1))
      .union(BABYLON.CSG.FromMesh(d2))
      .union(BABYLON.CSG.FromMesh(d3))
      .union(BABYLON.CSG.FromMesh(d4))
      .union(BABYLON.CSG.FromMesh(handle1))
      .union(BABYLON.CSG.FromMesh(handle2))
      .union(BABYLON.CSG.FromMesh(handle3))
      .union(BABYLON.CSG.FromMesh(handle4));

    handle1.dispose();
    handle2.dispose();
    handle3.dispose();
    handle4.dispose();
    i1.dispose();
    i2.dispose();
    i3.dispose();
    i4.dispose();
    d1.dispose();
    d2.dispose();
    d3.dispose();
    d4.dispose();
    wall.dispose();

    wall = csg.toMesh('wall', multiMat, scene, true);
  }

  wall.scaling = new BABYLON.Vector3(tileSize, tileSize, tileSize);
  wall.position.y = tileSize / 2;
  return wall;
}
