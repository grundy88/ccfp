import * as BABYLON from 'babylonjs';
import * as Textures from 'babylonjs-procedural-textures';
import { MESH_SIZE } from '../../util/utils';
import exitImage from './tile-exit.png';
import gradientImage from './gradient.jpg';

export async function create(scene) {
  // const material = new Materials.GradientMaterial("material", scene);
  // material.topColor = new BABYLON.Color4(1, 0, 0, 0);
  // material.bottomColor = new BABYLON.Color4(0, 1, 0, 0);
  // material.offset = 0.25;
  const material = new BABYLON.StandardMaterial('material', scene);
  material.opacityTexture = new BABYLON.Texture(gradientImage, scene, 0, 1);
  material.opacityTexture.wAng = -Math.PI / 2;
  material.opacityTexture.getAlphaFromRGB = true;

  material.diffuseColor = new BABYLON.Color3(0, 0, 1);
  material.emissiveColor = new BABYLON.Color3(0, 0, 1);
  const fireTexture = new Textures.FireProceduralTexture('fire', 256, scene);
  material.emissiveTexture = fireTexture;
  // material.opacityTexture = fireTexture;
  material.alpha = 0.3;
  // const gl = new BABYLON.GlowLayer("glow", scene);
  // gl.intensity = 0.5;

  // const g = BABYLON.MeshBuilder.CreateCylinder("", {height: 1, diameterTop: 1, diameterBottom: 0, tessellation: 4}, scene);

  const myShape = [
    new BABYLON.Vector3(1.05, 0, 0),
    new BABYLON.Vector3(1.2, 0.5, 0),
  ];

  const glow = BABYLON.MeshBuilder.CreateLathe('lathe', {
    shape: myShape, radius: 0.55, tessellation: 4, sideOrientation: BABYLON.Mesh.DOUBLESIDE,
  });

  glow.material = material;
  glow.rotation.y = Math.PI / 4;

  const box = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 1, depth: 1 });
  box.position.y = -1;
  // const portal = BABYLON.MeshBuilder.CreateBox("", { height: 0.1, width: 1, depth: 1 });

  const portal = BABYLON.Mesh.CreatePlane('', 0.8, scene);
  portal.rotation.x += Math.PI / 2;
  portal.position.y = -0.01;

  portal.material = new BABYLON.StandardMaterial('material', scene);
  portal.material.diffuseTexture = new BABYLON.Texture(exitImage, scene);
  portal.material.backFaceCulling = true;

  const multiMat = new BABYLON.MultiMaterial('multiMat', scene);
  multiMat.subMaterials.push(glow.material, portal.material, portal.material);

  const exit = BABYLON.CSG.FromMesh(glow)
    .subtract(BABYLON.CSG.FromMesh(box))
    .union(BABYLON.CSG.FromMesh(portal))
    .toMesh('', multiMat, scene, true);

  glow.dispose();
  portal.dispose();
  box.dispose();

  exit.scaling = new BABYLON.Vector3(MESH_SIZE, MESH_SIZE, MESH_SIZE);
  exit.position.y = 0.4;
  return exit;
}
