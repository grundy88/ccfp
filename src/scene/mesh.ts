import * as BABYLON from 'babylonjs';
import { CC } from '../logic/tile';
import * as Wall from '../meshes/wall/wall';
import * as Door from '../meshes/doors/door';
import * as Key from '../meshes/keys/key';
import * as ComputerChip from '../meshes/computerchip/computerchip';
import * as Floor from '../meshes/floor/floor';
import * as Socket from '../meshes/socket/socket';
import * as Exit from '../meshes/exit/exit';
import * as Water from '../meshes/water/water';
import * as Fire from '../meshes/fire/fire';
import * as Dirt from '../meshes/dirt/dirt';
import * as Block from '../meshes/block/block';
import * as Bug from '../meshes/bug/bug';

const meshes = new Map<number, BABYLON.Mesh>();

export const Flags = Object.freeze({
  invariant: 1 << 1,
  castsShadows: 1 << 2,
  receivesShadows: 1 << 3,
  castsReflection: 1 << 4,
  rotates: 1 << 5,
  nofloor: 1 << 6,
  clone: 1 << 7,
});

export const Meshes = Object.freeze({
  [CC.FLOOR.code]: { creator: async (scene: BABYLON.Scene) => Floor.create(scene), flags: Flags.invariant | Flags.receivesShadows | Flags.nofloor },
  [CC.WALL.code]: { creator: async (scene: BABYLON.Scene) => Wall.create(scene), flags: Flags.invariant | Flags.castsShadows | Flags.castsReflection },
  [CC.RED_DOOR.code]: { creator: async (scene: BABYLON.Scene) => Door.create(scene, Key.Color.RED), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.BLUE_DOOR.code]: { creator: async (scene: BABYLON.Scene) => Door.create(scene, Key.Color.BLUE), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.YELLOW_DOOR.code]: { creator: async (scene: BABYLON.Scene) => Door.create(scene, Key.Color.YELLOW), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.GREEN_DOOR.code]: { creator: async (scene: BABYLON.Scene) => Door.create(scene, Key.Color.GREEN), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.RED_KEY.code]: { creator: async (scene: BABYLON.Scene) => Key.create(scene, Key.Color.RED), flags: Flags.rotates | Flags.castsShadows | Flags.castsReflection },
  [CC.BLUE_KEY.code]: { creator: async (scene: BABYLON.Scene) => Key.create(scene, Key.Color.BLUE), flags: Flags.rotates | Flags.castsShadows | Flags.castsReflection },
  [CC.YELLOW_KEY.code]: { creator: async (scene: BABYLON.Scene) => Key.create(scene, Key.Color.YELLOW), flags: Flags.rotates | Flags.castsShadows | Flags.castsReflection },
  [CC.GREEN_KEY.code]: { creator: async (scene: BABYLON.Scene) => Key.create(scene, Key.Color.GREEN), flags: Flags.rotates | Flags.castsShadows | Flags.castsReflection },
  [CC.COMPUTER_CHIP.code]: { creator: async (scene: BABYLON.Scene) => ComputerChip.create(scene), flags: Flags.rotates | Flags.castsShadows | Flags.castsReflection },
  [CC.SOCKET.code]: { creator: async (scene: BABYLON.Scene) => Socket.create(scene), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.EXIT.code]: { creator: async (scene: BABYLON.Scene) => Exit.create(scene) },
  [CC.WATER.code]: { creator: async (scene: BABYLON.Scene) => Water.create(scene), flags: Flags.nofloor | Flags.clone },
  [CC.FIRE.code]: { creator: async (scene: BABYLON.Scene) => Fire.create(scene), flags: Flags.nofloor },
  [CC.DIRT.code]: { creator: async (scene: BABYLON.Scene) => Dirt.create(scene) },
  [CC.BLOCK.code]: { creator: async (scene: BABYLON.Scene) => Block.create(scene), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.BUG_N.code]: { creator: async (scene: BABYLON.Scene) => Bug.create(scene), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.BUG_E.code]: { creator: async (scene: BABYLON.Scene) => Bug.create(scene), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.BUG_S.code]: { creator: async (scene: BABYLON.Scene) => Bug.create(scene), flags: Flags.castsShadows | Flags.castsReflection },
  [CC.BUG_W.code]: { creator: async (scene: BABYLON.Scene) => Bug.create(scene), flags: Flags.castsShadows | Flags.castsReflection },
});

// todo stop all the awaits, setup meshes map with promise results
async function loadMeshes(scene: BABYLON.Scene, progressCallback: (pct: number) => Promise<void>) {
  const p = new Progress(Object.keys(Meshes).length, progressCallback);
  for (const k of Object.keys(Meshes)) {
    const key = parseInt(k);
    await p.do(key, await Meshes[key]!.creator(scene));
  }
}

function cloneMesh(code: number, x: number = 0, y: number = 0, prefix: string = ''): BABYLON.Mesh | null {
  const original = meshes.get(code);
  if (!original) return null;
  const mesh = original!.clone(`${prefix}${x}-${y}`);
  mesh.setEnabled(true);
  return mesh;
}

function instanceMesh(code: number, x: number = 0, y: number = 0, prefix: string = ''): BABYLON.AbstractMesh | null {
  const original = meshes.get(code);
  if (!original) return null;
  const mesh = original!.createInstance(`${prefix}${x}-${y}`);
  mesh.setEnabled(true);
  return mesh;
}

function getMesh(code: number) {
  return meshes.get(code);
}

class Progress {
  counter: number = 0;
  total: number;
  callback: (pct: number) => Promise<void>;

  constructor(total: number, callback: (pct: number) => Promise<void>) {
    this.total = total;
    this.callback = callback;
  }

  async do(code: number, mesh: BABYLON.Mesh) {
    // const mesh = await creator();
    mesh.setEnabled(false);
    meshes.set(code, mesh);
    // console.log(`------ set ${code}`)
    if (this.callback) await this.callback(++this.counter / this.total);
  }
}

export { loadMeshes, cloneMesh, instanceMesh, getMesh };
