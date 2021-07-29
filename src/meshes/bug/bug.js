import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { MESH_SIZE } from '../../util/utils';
import model from './bug.babylon';

export async function create(scene) {
  const bodyMaterial = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  bodyMaterial.baseColor = new BABYLON.Color3(194 / 255, 118 / 255, 227 / 255);
  bodyMaterial.metallic = 0.95;
  bodyMaterial.roughness = 0.4;

  const yellowMaterial = new BABYLON.PBRMetallicRoughnessMaterial('pbr', scene);
  yellowMaterial.baseColor = new BABYLON.Color3(1.0, 1.0, 0.56);
  yellowMaterial.metallic = 0.95;
  yellowMaterial.roughness = 0.8;

  const headMaterial = new BABYLON.StandardMaterial('material', scene);
  headMaterial.diffuseColor = BABYLON.Color3.Black();

  return new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh(null, '', model.substring(1), scene, (meshes) => {
      const body = scene.getMeshByID('body');
      const yellow = scene.getMeshByID('yellow');
      const head = scene.getMeshByID('head');

      body.material = bodyMaterial;
      yellow.material = yellowMaterial;
      head.material = headMaterial;

      const bug = BABYLON.Mesh.MergeMeshes([body, yellow, head], true, true, undefined, false, true);
      bug.scaling = new BABYLON.Vector3(MESH_SIZE / 4, MESH_SIZE / 4, MESH_SIZE / 4);
      bug.position.y = 2;
      bug.rotation.y = Math.PI;

      meshes.forEach((m) => m.dispose());

      resolve(bug);
    });
  });
}
