import * as BABYLON from 'babylonjs';
import { MESH_SIZE } from '../../util/utils';
import dirtImage from './dirt.png';

export async function create(scene: BABYLON.Scene) {
  const material = new BABYLON.StandardMaterial('', scene);
  material.diffuseTexture = new BABYLON.Texture(dirtImage, scene);

  const dirt = BABYLON.Mesh.CreatePlane('', MESH_SIZE, scene);
  dirt.rotation.x += Math.PI / 2;
  dirt.position.y = 0.01;

  dirt.material = material;

  return dirt;
}
