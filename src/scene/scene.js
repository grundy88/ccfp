import * as BABYLON from 'babylonjs';
import { MESH_SIZE } from '../util/utils';

/**
 * BabyonJS Scene object creation.
 * This is done once and the scene is reused forever.
 */

export const LEVEL_SIZE = 32;
export const OX = -(LEVEL_SIZE * MESH_SIZE) / 2;
export const OZ = (LEVEL_SIZE * MESH_SIZE) / 2;
export const HALF = MESH_SIZE / 2;
export const CAMERA_HEIGHT = 16;

export const createScene = (canvas, uiState) => {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.2, 0.4, 0.9, 1);

  const camera = new BABYLON.FreeCamera('sceneCamera', new BABYLON.Vector3(0, CAMERA_HEIGHT, -5), scene);
  camera.inputs.clear();
  camera.inputs.addMouse();

  camera.attachControl(canvas, true);
  camera.setTarget(new BABYLON.Vector3(0, CAMERA_HEIGHT, 5));

  // ----------------------------------------------------------------
  // controls

  scene.onPointerDown = () => {
    if (!uiState.isPointerLocked) {
      canvas.requestPointerLock = canvas.requestPointerLock
          || canvas.msRequestPointerLock
          || canvas.mozRequestPointerLock
          || canvas.webkitRequestPointerLock;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  };

  const pointerLockChange = () => {
    if (document.pointerLockElement === canvas
        || document.mozPointerLockElement === canvas
        || document.webkitPointerLockElement === canvas
    ) {
      uiState.setPointerLocked(true);
    } else {
      uiState.setPointerLocked(false);
    }
  };
  document.addEventListener('pointerlockchange', pointerLockChange, false);
  document.addEventListener('mozpointerlockchange', pointerLockChange, false);
  document.addEventListener('webkitpointerlockchange', pointerLockChange, false);

  // Skybox
  const skybox = BABYLON.Mesh.CreateBox('skyBox', 5000.0, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('textures/TropicalSunnyDay', scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;

  const light0 = new BABYLON.HemisphericLight('', new BABYLON.Vector3(0, 1, 0), scene);
  light0.intensity = 0.5;
  light0.specular = new BABYLON.Color3.Black();
  const light1 = new BABYLON.HemisphericLight('', new BABYLON.Vector3(-1, -0.8, 0), scene);
  light1.intensity = 0.5;
  light1.specular = new BABYLON.Color3.Black();
  const light2 = new BABYLON.HemisphericLight('', new BABYLON.Vector3(1, -0.8, 0), scene);
  light2.intensity = 0.5;
  light2.specular = new BABYLON.Color3.Black();

  const light = new BABYLON.DirectionalLight('', new BABYLON.Vector3(-1, -2, -1), scene);
  light.position = new BABYLON.Vector3(1000, 1000, 1000);
  light.intensity = 0.5;
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
  // shadowGenerator.usePoissonSampling = true;
  shadowGenerator.useBlurExponentialShadowMap = true;

  engine.runRenderLoop(() => {
    scene.render();
    uiState.setFps(engine.getFps().toFixed());
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });

  return [scene, shadowGenerator, camera];
};
