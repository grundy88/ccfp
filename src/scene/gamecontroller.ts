import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import { Creature } from '../logic/creature';
import { Dir, dirtoindex, left, back, right } from '../logic/dir';
import { levelToGameState } from '../logic/gamestate';
import { Level } from '../logic/level';
import { LynxLogic, lynxlogicstartup } from '../logic/lynx';
import { CC, isChip } from '../logic/tile';
import { TW, TWtoCC } from '../logic/twtile';
import UIState from '../state/UIState';
import { EndReasons, layerIndexForPoint, pointForLayerIndex, MESH_SIZE } from '../util/utils';
import { loadAnimations, splash } from './animation';
import { Meshes, Flags, loadMeshes, cloneMesh, instanceMesh, getMesh } from './mesh';
import { LEVEL_SIZE, OX, OZ, HALF, CAMERA_HEIGHT } from './scene';
import { gameloop } from './gameloop';

const MESH_LOAD_PCT = 0.6;

const DirForKey = {
  ArrowUp: Dir.N,
  ArrowDown: Dir.S,
  ArrowLeft: Dir.W,
  ArrowRight: Dir.E,
  w: Dir.N,
  s: Dir.S,
  a: Dir.W,
  d: Dir.E,
};

type CameraTurn = {
  cameraTarget: number;
  cameraStart: number;
  cameraStartTime: number;
};

export class GameController {
  scene: BABYLON.Scene;
  camera: BABYLON.FreeCamera;
  shadowGenerator: BABYLON.ShadowGenerator;
  uiState: UIState;

  level: Level | null = null;

  objects: BABYLON.AbstractMesh[] = [];
  invariants: Map<number, BABYLON.Mesh[]> = new Map();

  gamelogic: LynxLogic | null = null;

  meshesLoaded = false;

  constructor(scene: BABYLON.Scene, shadowGenerator: BABYLON.ShadowGenerator, camera: BABYLON.FreeCamera, uiState: UIState) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.camera = camera;
    this.uiState = uiState;

    document.addEventListener('keydown', this.keyDown);
    document.addEventListener('keyup', this.keyUp);
    document.addEventListener('mouseup', this.mouseUp);

    this.scene.registerBeforeRender(() => gameloop(this.gamelogic, this.uiState, this.scene, this.camera, this.cameraTurn));
  }

  // ----------------------------------------------------------------

  /**
   * Load all 3d objects into the scene, from which they will be cloned as needed
   */
  async loadMeshes() {
    if (!this.meshesLoaded) {
      await loadMeshes(this.scene, (pct) => this.uiState.loadProgress.setPercent(pct * MESH_LOAD_PCT));
      loadAnimations(this.scene);
      this.meshesLoaded = true;
    }
  }

  // ----------------------------------------------------------------

  /**
   * Clone 3d objects per the level's map
   */
  async setupLevel(level: Level) {
    this.level = level;
    const waterReflectors: BABYLON.AbstractMesh[] = [];
    const rotators: BABYLON.AbstractMesh[] = [];

    for (let x = 0; x < LEVEL_SIZE; x++) {
      for (let y = 0; y < LEVEL_SIZE; y++) {
        let code = level.topLayer[layerIndexForPoint(x, y)];
        if (isChip(code)) moveTo(this.camera, x, y);

        if (!(code in Meshes)) code = CC.FLOOR.code;
        const flags = Meshes[code].flags || 0;

        let o;
        if (flags & Flags.invariant) {
          o = invariant(this.invariants, code, x, y)!;
        } else if (flags & Flags.clone) {
          o = cloneAt(code, x, y)!;
          this.objects.push(o);
        } else {
          o = instanceAt(code, x, y)!;
          this.objects.push(o);
        }

        if (!(flags & Flags.nofloor)) invariant(this.invariants, CC.FLOOR.code, x, y, 'floor-');

        if (flags & Flags.castsShadows) this.shadowGenerator.getShadowMap()!.renderList!.push(o);
        if (flags & Flags.receivesShadows) o.receiveShadows = true;
        if (flags & Flags.castsReflection) waterReflectors.push(o);
        if (flags & Flags.rotates) rotators.push(o);
      }
      await this.uiState.loadProgress.setPercent(MESH_LOAD_PCT + (1 - MESH_LOAD_PCT) * (x / LEVEL_SIZE));
    }

    if (rotators.length > 0) {
      this.scene.registerBeforeRender(() => rotators.forEach((o) => { o.rotation.y += 0.03; }));
    }

    // optimization: merge invariants into one mesh each
    // this seems to result in higher FPS than many instance meshes (which cannot be merged)
    // todo perhaps check out SPS https://doc.babylonjs.com/divingDeeper/particles/solid_particle_system/sps_intro
    this.invariants.forEach((meshes, code) => {
      const combined = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
      if (combined) {
        const flags = Meshes[code].flags || 0;
        if (flags & Flags.receivesShadows) combined.receiveShadows = true;
        if (flags & Flags.castsShadows) this.shadowGenerator.getShadowMap()!.renderList!.push(combined);
        if (flags & Flags.castsReflection) waterReflectors.push(combined);
        meshes.forEach((o) => {
          removeFromList(waterReflectors, o);
          removeFromList(this.shadowGenerator.getShadowMap()!.renderList!, o);
          o.dispose();
        });
        // replace list of invariant meshes with combined mesh
        this.invariants.set(code, [combined]);
      }
    });

    const water = getMesh(CC.WATER.code);
    if (water) waterReflectors.forEach((o) => (water.material! as Materials.WaterMaterial).addToRenderList(o));
  }

  // ----------------------------------------------------------------

  /**
   * Start the game logic (who's existence will cause the gameloop to actually do something).
   * This is also where any actions from the logic that would affect the display should go
   * (as opposed to the gameloop which updates map objects as time goes by).
   */
  startLevel() {
    this.gamelogic = lynxlogicstartup();
    this.gamelogic.state = levelToGameState(this.level!);
    this.gamelogic.state.nextDirProvider = this.keyboardDirProvider;
    this.gamelogic.initgame();

    this.gamelogic.state.mapUpdatedCallback = (pos: number, tile: number) => {
      const [x, y] = pointForLayerIndex(pos);
      // mesh name MUST match the name given during its cloning/instancing
      disposeMesh(this.scene.getMeshByName(`${x}-${y}`));

      const code = TWtoCC[tile];
      if (code === CC.FLOOR.code) {
        // todo only if not already floor
        this.objects.push(cloneAt(CC.FLOOR.code, x, y)!);
      } else if (code === CC.WALL.code) {
        this.objects.push(cloneAt(CC.WALL.code, x, y)!);
      } else if (code === CC.DIRT.code) {
        this.objects.push(cloneAt(CC.DIRT.code, x, y)!);
        this.objects.push(cloneAt(CC.FLOOR.code, x, y)!);
      }
    };

    this.gamelogic.state.removeCreatureCallback = (cr: Creature, animationid: number) => {
      disposeMesh(this.scene.getMeshByName(cr.key));

      if (animationid === TW.Water_Splash) splash(cr.pos);
      // todo
      // else if (animationid === TW.Bomb_Explosion) null;
      // else if (animationid === TW.Entity_Explosion) null;
    };

    this.uiState.gameStarted();
  }

  // ----------------------------------------------------------------

  /**
   * Clear the level-specific 3d objects from the scene and
   * end the game logic.
   */
  exitGame() {
    this.keysDown.clear();
    this.keypressStack.length = 0;
    this.keyholdList.length = 0;

    this.shadowGenerator.getShadowMap()!.renderList!.length = 0;
    const water = getMesh(CC.WATER.code);
    if (water) {
      const waterMaterial = (water.material! as Materials.WaterMaterial);
      waterMaterial.reflectionTexture!.renderList!.length = 0;
      waterMaterial.addToRenderList(this.scene.getMeshByName('skyBox'));
    }

    this.objects.forEach((o) => o.dispose());
    this.invariants.forEach((meshes) => {
      meshes.forEach((m) => m.dispose());
    });
    this.invariants.clear();

    this.objects.length = 0;

    this.camera.position.x = 0;
    this.camera.position.z = 0;
    this.camera.setTarget(new BABYLON.Vector3(0, CAMERA_HEIGHT, 5));

    this.gamelogic = null;
    this.uiState.reset();
    unlockPointer();
  }

  // ====================================================================================
  // controls (private)

  keysDown = new Map();
  keypressStack: string[] = [];
  keyholdList: string[] = [];

  cameraTurn: CameraTurn = { cameraTarget: 0, cameraStart: 0, cameraStartTime: 0 };

  /**
   * Snap the camera to the nearest 90 degree direction
   * @param dir turn clockwise if > 0, coutner clockwise if < 0
   */
  turnCamera = (dir: number) => {
    let r = BABYLON.Tools.ToDegrees(this.camera.rotation.y) % 360;
    if (r < 0) r = 360 + r;
    if (r === 0 && dir < 0) { this.cameraTurn.cameraTarget = 270; r = 360; } else if (r >= 270 && dir > 0) this.cameraTurn.cameraTarget = 360;
    else if (dir > 0) this.cameraTurn.cameraTarget = Math.round((r + 90 - (r % 90)) % 360);
    else if (r % 90 === 0) this.cameraTurn.cameraTarget = Math.round(r - 90);
    else this.cameraTurn.cameraTarget = Math.round((r - (r % 90)));
    this.cameraTurn.cameraStart = r;
    this.cameraTurn.cameraStartTime = Date.now();
  };

  keyDown = async (e: KeyboardEvent) => {
    if (this.keysDown.has(e.key)) return;

    if (!this.gamelogic || !this.gamelogic.state) {
      if (this.uiState.isGameReady) this.startLevel();
    } else if (this.gamelogic.state.gameOver) {
      const restart = this.gamelogic.state.gameOver !== EndReasons.Exit;
      this.exitGame();
      if (restart) {
        this.uiState.startLoading();
        await this.setupLevel(this.level!);
        this.uiState.gameReady();
      }
    } else {
      // @ts-ignore
      // eslint-disable-next-line no-lonely-if
      if (DirForKey[e.key] && !e.ctrlKey && !e.metaKey) {
        // always record a press
        this.keypressStack.push(e.key);

        // put (or move) a hold to the front of the list
        const found = this.keyholdList.indexOf(e.key);
        if (found >= 0) this.keyholdList.splice(found, 1);
        this.keyholdList.unshift(e.key);

        this.keysDown.set(e.key, true);
      } else if (e.key === 'q') {
        this.turnCamera(-1);
      } else if (e.key === 'e') {
        this.turnCamera(1);
      }
    }
  };

  keyUp = (e: KeyboardEvent) => {
    // remove the hold from the list
    const found = this.keyholdList.indexOf(e.key);
    if (found >= 0) this.keyholdList.splice(found, 1);

    this.keysDown.delete(e.key);
    e.preventDefault();
  };

  keyboardDirProvider = {
    getNextDir: () => {
      // transform to desired direction based on where the camera is facing
      const camdir = this.camera.getDirection(BABYLON.Axis.Z);
      // @ts-ignore
      const press = dirPerCamera(camdir, DirForKey[this.keypressStack.shift()]);
      // @ts-ignore
      const hold = dirPerCamera(camdir, DirForKey[this.keyholdList[0]]);
      const d = press | hold;
      // if a valid diagonal, use that
      if (dirtoindex(d) !== -1) return d;
      // if not diagonal, keypress gets priority, otherwise it's the latest key still held down
      return press || hold || 0;
    },
  };

  mouseUp = () => {
    if (!this.gamelogic || !this.gamelogic.state) {
      if (this.uiState.isGameReady) this.startLevel();
    }
  };
}

// --------------------------------------------------------
// helpers

function cloneAt(code: number, x: number, y: number, prefix?: string) {
  const c: BABYLON.Mesh | null = cloneMesh(code, x, y, prefix);
  moveTo(c, x, y);
  return c;
}

function instanceAt(code: number, x: number, y: number, prefix?: string) {
  const c: BABYLON.AbstractMesh | null = instanceMesh(code, x, y, prefix);
  moveTo(c, x, y);
  return c;
}

function moveTo(o: BABYLON.Mesh | BABYLON.AbstractMesh | BABYLON.Camera | null, x: number, y: number, yoffset = 0) {
  if (!o) return null;
  o.position.x = OX + x * MESH_SIZE + HALF;
  o.position.z = OZ - (y * MESH_SIZE + HALF + yoffset);
  return o;
}

function invariant(invariants: Map<number, BABYLON.AbstractMesh[]>, code: number, x: number, y: number, prefix?: string) {
  const o = cloneAt(code, x, y, prefix);
  if (!o) return null;
  let l = invariants.get(code);
  if (!l) {
    l = [];
    invariants.set(code, l);
  }
  l.push(o);
  return o;
}

function removeFromList(list: any[], o: any) {
  const index = list.indexOf(o);
  if (index > -1) list.splice(index, 1);
}

function disposeMesh(mesh: BABYLON.AbstractMesh | null) {
  if (mesh) {
    const water = getMesh(CC.WATER.code)!;
    const reflectionList = (water.material! as Materials.WaterMaterial).reflectionTexture!.renderList!;
    removeFromList(reflectionList, mesh);
    mesh.dispose();
  }
}

function dirPerCamera(camdir: BABYLON.Vector3, dir: number) {
  if (camdir.z > 0 && camdir.z > Math.abs(camdir.x)) return dir;
  if (camdir.x > 0 && camdir.x > Math.abs(camdir.z)) return right(dir);
  if (camdir.z < 0 && Math.abs(camdir.z) > Math.abs(camdir.x)) return back(dir);
  return left(dir);
}

function unlockPointer() {
  // @ts-ignore
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
  if (document.exitPointerLock) document.exitPointerLock();
}
