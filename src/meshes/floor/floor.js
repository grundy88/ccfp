import * as BABYLON from 'babylonjs';
import { MESH_SIZE } from '../../util/utils';

export async function create(scene) {
  const h = 0.25;
  const w = 1;
  // amount to chop off the corners
  const chopAmount = 0.595;

  const base = BABYLON.MeshBuilder.CreateBox('', { height: h, width: w, depth: w });

  const corner = BABYLON.MeshBuilder.CreateBox('', { height: h, width: w + 1, depth: h });
  corner.setEnabled(false);
  corner.rotation.x = Math.PI / 4;
  corner.position.y = 0.2;

  const m10 = corner.clone();
  m10.position.z = -chopAmount;
  const m11 = corner.clone();
  m11.position.z = chopAmount;
  const m12 = corner.clone();
  m12.rotation.y = Math.PI / 2;
  m12.position.x = -chopAmount;
  const m13 = corner.clone();
  m13.rotation.y = Math.PI / 2;
  m13.position.x = chopAmount;

  const csg = BABYLON.CSG.FromMesh(base)
    .subtract(BABYLON.CSG.FromMesh(m10))
    .subtract(BABYLON.CSG.FromMesh(m11))
    .subtract(BABYLON.CSG.FromMesh(m12))
    .subtract(BABYLON.CSG.FromMesh(m13));
  base.dispose();
  corner.dispose();
  m10.dispose();
  m11.dispose();
  m12.dispose();
  m13.dispose();

  const material = new BABYLON.StandardMaterial('material', scene);
  material.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.75);
  material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const floor =  csg.toMesh('floor', material, scene);
  floor.scaling = new BABYLON.Vector3(MESH_SIZE, MESH_SIZE, MESH_SIZE);
  floor.position.y = -MESH_SIZE * h / 2;
  floor.receiveShadows = true;
  return floor;
}
