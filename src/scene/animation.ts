import * as BABYLON from 'babylonjs';
import { MESH_SIZE } from '../util/utils';
import { pointForLayerIndex } from '../util/utils';
import { OX, OZ, HALF } from './scene';
import flareImage from '../assets/flare.png';

let splashSystem: BABYLON.ParticleSystem;

function loadAnimations(scene: BABYLON.Scene) {
  loadSplash(scene);
}

function loadSplash(scene: BABYLON.Scene) {
  splashSystem = new BABYLON.ParticleSystem('particles', 5000, scene);

  splashSystem.particleTexture = new BABYLON.Texture(flareImage, scene);

  splashSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
  splashSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
  splashSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

  splashSystem.minSize = 0.5;
  splashSystem.maxSize = 1.5;

  splashSystem.minLifeTime = 0.5;
  splashSystem.maxLifeTime = 1.0;

  splashSystem.emitRate = 5000;

  splashSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

  splashSystem.gravity = new BABYLON.Vector3(0, -9.81 * 15, 0);

  splashSystem.direction1 = new BABYLON.Vector3(-5, 8, 5);
  splashSystem.direction2 = new BABYLON.Vector3(5, 8, -5);

  splashSystem.minAngularSpeed = 0;
  splashSystem.maxAngularSpeed = Math.PI;

  splashSystem.minEmitPower = 5;
  splashSystem.maxEmitPower = 10;
  splashSystem.updateSpeed = 0.025;

  splashSystem.targetStopDuration = 0.1;
  splashSystem.disposeOnStop = true;
}

function splash(pos: number) {
  const [x, y] = pointForLayerIndex(pos);
  // why is this divided by 2?!
  const sx = (OX + x * MESH_SIZE + HALF) / 2;
  const sz = (OZ - (y * MESH_SIZE + HALF)) / 2;
  const s = splashSystem.clone('', new BABYLON.Vector3(sx, 0, sz));
  s.minEmitBox = new BABYLON.Vector3(sx - MESH_SIZE / 2, 0, sz - MESH_SIZE / 2);
  s.maxEmitBox = new BABYLON.Vector3(sx + MESH_SIZE / 2, 0, sz + MESH_SIZE / 2);
  s.start();
}

export { loadAnimations, splash };
