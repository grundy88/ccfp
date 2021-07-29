import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { MESH_SIZE } from '../../util/utils';
import computerchip from './ic.obj';

export async function create(scene) {
  const bodyMaterial = new BABYLON.StandardMaterial('material', scene);
  bodyMaterial.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  bodyMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  bodyMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const pbr = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  pbr.baseColor = new BABYLON.Color3(0.75, 0.75, 0.75);
  pbr.metallic = 0.3;
  pbr.roughness = 0.0;

  return new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh('', '', computerchip.substring(1), scene, (meshes) => {
      meshes[0].material = bodyMaterial;
      meshes[1].material = pbr;

      const chip = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
      chip.scaling = new BABYLON.Vector3(MESH_SIZE / 16, MESH_SIZE / 16, MESH_SIZE / 16);
      chip.position.y = MESH_SIZE / 3;

      chip.addRotation(BABYLON.Tools.ToRadians(70), 0, 0);

      resolve(chip);
    });
  });
}
