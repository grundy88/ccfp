import * as BABYLON from 'babylonjs';
import fenceImage from './fence.png';
import { MESH_SIZE } from '../../util/utils';
import socketModel from './socket.gltf';

export async function create(scene) {
  const plaqueMaterial = new BABYLON.StandardMaterial('material', scene);
  plaqueMaterial.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.75);
  plaqueMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  plaqueMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const socketMaterial = new BABYLON.StandardMaterial('material', scene);
  socketMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  socketMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  socketMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const fenceMaterial = new BABYLON.StandardMaterial('material', scene);
  fenceMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  fenceMaterial.opacityTexture = new BABYLON.Texture(fenceImage, scene);
  fenceMaterial.backFaceCulling = false;
  fenceMaterial.useAlphaFromDiffuseTexture = true;
  fenceMaterial.opacityTexture.uScale = 3;
  fenceMaterial.opacityTexture.vScale = 3;
  const faceUV = new Array(6);

  // remove top and bottom
  faceUV[4] = new BABYLON.Vector4(0, 0, 0, 0);
  faceUV[5] = new BABYLON.Vector4(0, 0, 0, 0);

  const h = 0.9;
  const w = 0.95;

  const fence = BABYLON.MeshBuilder.CreateBox('', { height: h, width: w, depth: w, faceUV });
  fence.material = fenceMaterial;

  const s1 = await new Promise((resolve) => {
    BABYLON.SceneLoader.ImportMesh(null, '', socketModel.substring(1), scene, (meshes) => {
      meshes[1].material = plaqueMaterial;
      meshes[2].material = socketMaterial;
      const s = BABYLON.Mesh.MergeMeshes(meshes.slice(1), true, true, undefined, false, true);
      s.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
      // s.position.y = -0.5;

      resolve(s);
    });
  });

  const s2 = s1.clone();
  const s3 = s1.clone();
  const s4 = s1.clone();
  s1.position.x = -0.5;
  s2.rotation.y = Math.PI;
  s2.position.x = 0.5;
  s3.rotation.y = Math.PI / 2;
  s3.position.z = 0.5;
  s4.rotation.y = -Math.PI / 2;
  s4.position.z = -0.5;

  const socket = BABYLON.Mesh.MergeMeshes([fence, s1, s2, s3, s4], true, true, undefined, false, true);
  socket.scaling = new BABYLON.Vector3(MESH_SIZE, MESH_SIZE, MESH_SIZE);
  socket.position.y = MESH_SIZE / 2;

  fence.dispose();
  s1.dispose();
  s2.dispose();
  s3.dispose();
  s4.dispose();

  return socket;
}
