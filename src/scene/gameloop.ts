import * as BABYLON from 'babylonjs';
import { LynxLogic } from '../logic/lynx';
import { isChip } from '../logic/tile';
import { TW, TWtoCC } from '../logic/twtile';
import UIState from '../state/UIState';
import { Dir } from '../logic/dir';
import { Creature } from '../logic/creature';
import { pointForLayerIndex, STEPS_PER_SECOND, TICKS_PER_STEP, MESH_SIZE } from '../util/utils';
import { OX, OZ, HALF } from './scene';

const TICKS_PER_SECOND = TICKS_PER_STEP * STEPS_PER_SECOND;
const MILLIS_PER_TICK = 1000 / TICKS_PER_SECOND;
const MILLIS_PER_TURN = 1000 / STEPS_PER_SECOND;

let lastFrameTimeMs = 0;
let millisSinceLastTick = 0;

export type CameraTurn = {
  cameraTarget: number;
  cameraStart: number;
  cameraStartTime: number;
};

export const gameloop = (
  gamelogic: LynxLogic | null,
  uiState: UIState,
  scene: BABYLON.Scene,
  camera: BABYLON.FreeCamera,
  cameraTurn: CameraTurn,
) => {
  if (!gamelogic) return;
  if (gamelogic.state.gameOver) {
    if (!uiState.isGameOver) uiState.setGameOver(gamelogic.state.gameOver);
    return;
  }

  const now = Date.now();
  const delta = now - lastFrameTimeMs;
  millisSinceLastTick += delta;
  lastFrameTimeMs = now;

  for (const cr of gamelogic.state.creatures) {
    let x; let
      y;
    if (cr.moveStartTimestamp) {
      const pct = (now - cr.moveStartTimestamp) / MILLIS_PER_TURN;
      [x, y] = getCreatureLocation(cr, pct);
    } else {
      [x, y] = getCreatureLocation(cr);
    }

    if (isChip(TWtoCC[cr.id])) {
      camera.position.x = x;
      camera.position.z = y;
    } else {
      const o = scene.getMeshByName(cr.key);
      if (o) {
        o.position.x = x;
        o.position.z = y;
        if (cr.id !== TW.Block) {
          switch (cr.dir) {
            case Dir.N: o.rotation.y = 0; break;
            case Dir.S: o.rotation.y = Math.PI; break;
            case Dir.W: o.rotation.y = -Math.PI / 2; break;
            case Dir.E: o.rotation.y = Math.PI / 2; break;
            default:
          }
        }
      }
    }
  }

  if (cameraTurn.cameraTarget >= 0) {
    const MILLIS_PER_DEGREE = MILLIS_PER_TURN / 90 / 2;
    if (cameraTurn.cameraTarget > cameraTurn.cameraStart) {
      const degrees = cameraTurn.cameraStart + (now - cameraTurn.cameraStartTime) / MILLIS_PER_DEGREE;
      if (degrees >= cameraTurn.cameraTarget) {
        camera.rotation.y = BABYLON.Tools.ToRadians(cameraTurn.cameraTarget);
        cameraTurn.cameraTarget = -1;
        cameraTurn.cameraStart = -1;
      } else {
        camera.rotation.y = BABYLON.Tools.ToRadians(degrees);
      }
    } else {
      const degrees = cameraTurn.cameraStart - (now - cameraTurn.cameraStartTime) / MILLIS_PER_DEGREE;
      if (degrees <= cameraTurn.cameraTarget) {
        camera.rotation.y = BABYLON.Tools.ToRadians(cameraTurn.cameraTarget);
        cameraTurn.cameraTarget = -1;
        cameraTurn.cameraStart = -1;
      } else {
        camera.rotation.y = BABYLON.Tools.ToRadians(degrees);
      }
    }
  }

  if (millisSinceLastTick > MILLIS_PER_TICK) {
    // console.log(`${now} - ${delta}`);
    gamelogic.advancegame();

    uiState.setNumChipsNeeded(gamelogic.state.chipsNeeded);
    uiState.setTimeLeft(gamelogic.state.getTimeLeft());
    uiState.setNumBlueKeys(gamelogic.getchip().numBlueKeys);
    uiState.setNumRedKeys(gamelogic.getchip().numRedKeys);
    uiState.setNumYellowKeys(gamelogic.getchip().numYellowKeys);
    uiState.setHasGreenKey(gamelogic.getchip().numGreenKeys > 0);
    uiState.setHasFlippers(gamelogic.getchip().hasFlippers);
    uiState.setHasFireBoots(gamelogic.getchip().hasFireboots);
    uiState.setHasIceSkates(gamelogic.getchip().hasSkates);
    uiState.setHasSuctionBoots(gamelogic.getchip().hasForceboots);

    millisSinceLastTick = 0;
  }
};

// in (x,z) scene coords
function getCreatureLocation(cr: Creature, pct: number | null = null) {
  if (!cr) return [-1, -1];
  const [tx, ty] = pointForLayerIndex(cr.pos);
  let scenex = OX + tx * MESH_SIZE + HALF;
  let sceney = OZ - (ty * MESH_SIZE + HALF);
  if (pct) {
    switch (cr.dir) {
      case Dir.N: sceney -= (1 - pct) * MESH_SIZE; break;
      case Dir.S: sceney += (1 - pct) * MESH_SIZE; break;
      case Dir.W: scenex += (1 - pct) * MESH_SIZE; break;
      case Dir.E: scenex -= (1 - pct) * MESH_SIZE; break;
      default:
    }
  }
  return [Math.round(scenex), Math.round(sceney)];
}
