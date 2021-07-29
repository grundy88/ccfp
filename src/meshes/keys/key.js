import * as BABYLON from 'babylonjs';
import { MESH_SIZE } from '../../util/utils';

export const Color = Object.freeze({
  RED: 1,
  BLUE: 2,
  YELLOW: 3,
  GREEN: 4,
});

export const Colors = Object.freeze({
  [Color.RED]: new BABYLON.Color3(1, 0.1, 0.1),
  [Color.BLUE]: new BABYLON.Color3(0.1, 0.3, 1),
  [Color.YELLOW]: new BABYLON.Color3(1, 1, 0),
  [Color.GREEN]: new BABYLON.Color3(0, 1, 0),
});

export const Shapes = Object.freeze({
  [Color.RED]: 3,
  [Color.BLUE]: 4,
  [Color.YELLOW]: 16,
  [Color.GREEN]: 6,
});

export async function create(scene, color = Color.GREEN) {
  const pbr = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  pbr.baseColor = Colors[color];
  pbr.metallic = 1.0;
  pbr.roughness = 0.4;

  const handle = BABYLON.MeshBuilder.CreateTorus('', { diameter: 0.3, thickness: 0.06, tessellation: Shapes[color] });
  handle.rotation.x = Math.PI / 2;
  handle.position.y = 0.3;
  handle.setEnabled(false);

  const shaft = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.3, diameter: 0.06, tessellation: 8 });
  shaft.setEnabled(false);

  const tooth1 = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.1, diameter: 0.03, tessellation: 8 });
  tooth1.rotation.z = Math.PI / 2;
  tooth1.position.y = -0.08;
  tooth1.position.x = -0.05;
  tooth1.setEnabled(false);
  const tooth2 = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.1, diameter: 0.03, tessellation: 8 });
  tooth2.rotation.z = Math.PI / 2;
  tooth2.position.y = -0.13;
  tooth2.position.x = -0.05;
  tooth2.setEnabled(false);

  const csg = BABYLON.CSG.FromMesh(shaft)
    .union(BABYLON.CSG.FromMesh(tooth1))
    .union(BABYLON.CSG.FromMesh(tooth2))
    .union(BABYLON.CSG.FromMesh(handle));
  const key = csg.toMesh('key', pbr, scene);
  key.scaling = new BABYLON.Vector3(MESH_SIZE / 1.5, MESH_SIZE / 1.5, MESH_SIZE / 1.5);
  key.position.y = 0.5 * MESH_SIZE / 2;
  key.addRotation(0, 0, BABYLON.Tools.ToRadians(-20));

  handle.dispose();
  shaft.dispose();
  tooth1.dispose();
  tooth2.dispose();

  return key;
}
