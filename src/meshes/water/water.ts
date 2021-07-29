import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import { MESH_SIZE } from '../../util/utils';
import waterImage from './waterbump.png';

export async function create(scene: BABYLON.Scene) {
  const waterMaterial = new Materials.WaterMaterial('water', scene, new BABYLON.Vector2(1024, 1024));
  waterMaterial.bumpTexture = new BABYLON.Texture(waterImage, scene);
  waterMaterial.windForce = -15;
  waterMaterial.waveHeight = 0.1;
  waterMaterial.bumpHeight = 0.5;
  waterMaterial.waveLength = 0.5;
  waterMaterial.windDirection = new BABYLON.Vector2(0.6, -1.0);
  waterMaterial.waterColor = new BABYLON.Color3(0.3, 0.3, 1);
  waterMaterial.colorBlendFactor = 0.5;

  waterMaterial.addToRenderList(scene.getMeshByName('skyBox'));

  const water = BABYLON.Mesh.CreatePlane('test', MESH_SIZE, scene);
  water.rotation.x += Math.PI / 2;
  water.position.y = -1;

  water.material = waterMaterial;

  return water;
}
