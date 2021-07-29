import * as BABYLON from 'babylonjs';
import { MESH_SIZE } from '../../util/utils';
import dirtImage from './dirt.png';
// @ts-ignore - todo figure out webpack loaders?
import wallModel from '../wall/wall.gltf';

export async function create(scene: BABYLON.Scene) {
  const material = new BABYLON.StandardMaterial('', scene);
  material.diffuseTexture = new BABYLON.Texture(dirtImage, scene);

  const h = 0.25;

  return new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh(null, '', wallModel.substring(1), scene, (meshes: BABYLON.AbstractMesh[]) => {
      const block = BABYLON.Mesh.MergeMeshes([meshes[1] as BABYLON.Mesh], true, true, undefined, false, true)!!;
      block.material = material;
      block.scaling = new BABYLON.Vector3(MESH_SIZE / 2, MESH_SIZE / 2 * h, MESH_SIZE / 2);
      block.position.y = MESH_SIZE / 2 * h;

      meshes.forEach((m) => m.dispose());

      resolve(block);
    });
  });
}
