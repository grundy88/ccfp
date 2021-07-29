import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { MESH_SIZE } from '../../util/utils';
import reddoor from './reddoor.gltf';
import bluedoor from './bluedoor.gltf';
import yellowdoor from './yellowdoor.gltf';
import greendoor from './greendoor.gltf';
import { Color, Colors } from '../keys/key';

const Models = Object.freeze({
  [Color.RED]: reddoor,
  [Color.BLUE]: bluedoor,
  [Color.YELLOW]: yellowdoor,
  [Color.GREEN]: greendoor,
});

export async function create(scene, doorColor) {
  const wallMaterial = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  wallMaterial.baseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
  wallMaterial.metallic = 0.95;
  wallMaterial.roughness = 0.4;

  const doorMaterial = new BABYLON.StandardMaterial('material', scene);
  doorMaterial.diffuseColor = Colors[doorColor];
  const symbolMaterial = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  symbolMaterial.baseColor = Colors[doorColor];
  symbolMaterial.metallic = 1.0;
  symbolMaterial.roughness = 0.4;

  return new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh(null, '', Models[doorColor].substring(1), scene, (meshes) => {
      const wall = scene.getMeshByID('01-wall');
      const doors = scene.getMeshByID('02-doors');
      const symbols = scene.getMeshByID('03-symbols');

      wall.material = wallMaterial;
      doors.material = doorMaterial;
      symbols.material = symbolMaterial;

      const door = BABYLON.Mesh.MergeMeshes([wall, doors, symbols], true, true, undefined, false, true);
      door.scaling = new BABYLON.Vector3(MESH_SIZE / 2, MESH_SIZE / 2, MESH_SIZE / 2);
      door.position.y = MESH_SIZE / 2;

      meshes.forEach((m) => m.dispose());

      resolve(door);
    });
  });
}
