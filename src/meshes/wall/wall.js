import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { MESH_SIZE } from '../../util/utils';
import wallModel from './wall.gltf';

export async function create(scene) {
  const wallMaterial = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  wallMaterial.baseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
  wallMaterial.metallic = 0.95;
  wallMaterial.roughness = 0.4;

  return new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh(null, '', wallModel.substring(1), scene, (meshes) => {
      const wall = BABYLON.Mesh.MergeMeshes([meshes[1]], true, true, undefined, false, true);
      wall.material = wallMaterial;
      wall.scaling = new BABYLON.Vector3(MESH_SIZE / 2, MESH_SIZE / 2, MESH_SIZE / 2);
      wall.position.y = MESH_SIZE / 2;

      meshes.forEach((m) => m.dispose());

      resolve(wall);
    });
  });
}
