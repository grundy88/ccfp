import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import { MESH_SIZE } from '../../util/utils';
import cloudImage from './cloud.png';
import lavaImage from './lavatile.jpg';

export async function create(scene: BABYLON.Scene) {
  const lavaMaterial = new Materials.LavaMaterial('', scene);
  lavaMaterial.noiseTexture = new BABYLON.Texture(cloudImage, scene); // Set the bump texture
  lavaMaterial.diffuseTexture = new BABYLON.Texture(lavaImage, scene); // Set the diffuse texture
  lavaMaterial.speed = 1;
  lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);

  const lava = BABYLON.Mesh.CreatePlane('', MESH_SIZE * 20, scene);
  lava.rotation.x += Math.PI / 2;
  lava.position.y = -0.5;
  lava.material = lavaMaterial;
  lava.scaling = new BABYLON.Vector3(1 / 20, 1 / 20, 1 / 20);

  return lava;
}
