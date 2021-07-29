import * as BABYLON from 'babylonjs';
import { loadMeshes, cloneMesh } from './mesh';
import { CC } from '../logic/tile';
import { MESH_SIZE } from '../util/utils';

export const createTestScene = async (canvas) => {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.2, 0.4, 0.9, 1);
  // scene.gravity = new BABYLON.Vector3(0, -0.15, 0);
  scene.collisionsEnabled = true;

  const camera = new BABYLON.ArcRotateCamera('Camera', 3 * Math.PI / 2, 1.5 * Math.PI / 4, 100, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  // const camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, CAMERA_HEIGHT, -5), scene);
  // camera.setTarget(new BABYLON.Vector3(0, CAMERA_HEIGHT, 0));
  // camera.attachControl(canvas, true);
  // // camera.applyGravity = true;
  // camera.checkCollisions = true;
  // camera.ellipsoid = new BABYLON.Vector3(HALF-1, CAMERA_HEIGHT, HALF-1);

  // // ----------------------------------------------------------------
  // // controls

  // // add wasd
  // camera.keysUp.push(87);
  // camera.keysDown.push(83);
  // camera.keysRight.push(68);
  // camera.keysLeft.push(65);

  // var isLocked = false;

  // // On click event, request pointer lock
  // scene.onPointerDown = function (evt) {
  //   //true/false check if we're locked, faster than checking pointerlock on each single click.
  //   if (!isLocked) {
  //     canvas.requestPointerLock = canvas.requestPointerLock
  //         || canvas.msRequestPointerLock
  //         || canvas.mozRequestPointerLock
  //         || canvas.webkitRequestPointerLock;
  //     if (canvas.requestPointerLock) {
  //       canvas.requestPointerLock();
  //     }
  //   }
  // };

  const light1 = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 1), scene);
  light1.intensity = 0.8;
  const light2 = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, -1, 0), scene);
  light2.intensity = 0.8;
  // const light = new BABYLON.DirectionalLight("", new BABYLON.Vector3(-1, -2, -1), scene);
  // light.position = new BABYLON.Vector3(1000, 1000, 1000);
  // light.intensity = 0.5;
  // var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);

  // ----------------------------------------------------------------
  // objects

  // const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:300, height:300});

  // const wall = await Wall.create(scene, TILE_SIZE);
  // wall.position.z = TILE_SIZE;
  // const floor = Floor.create(scene, TILE_SIZE);

  // // const o = ComputerChip.create(scene, TILE_SIZE);
  // // const o = Door.create(scene, TILE_SIZE, Key.Color.RED);
  // const o = await Socket.create(scene, TILE_SIZE);

  await loadMeshes(scene, (pct) => console.log(`>>>> ${pct}`));

  const wall = cloneMesh(CC.WALL.code);
  wall.position.z = MESH_SIZE;
  cloneMesh(CC.FLOOR.code);
  cloneMesh(CC.BUG_N.code);

  const divFps = document.getElementById('fps');
  engine.runRenderLoop(() => {
    scene.render();
    divFps.innerHTML = `${engine.getFps().toFixed()} fps`;
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });

  return scene;
};
