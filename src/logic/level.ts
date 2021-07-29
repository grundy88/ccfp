import { DEFAULT_LEVEL_SIZE, Link } from '../util/utils';
import { Creature } from './creature';
import { CC } from './tile';

export class Level {
  // ------------------------------------------------------
  // straight from the levelset file

  levelNumber = 0;
  title = '';
  password = '';
  timeLimit = 0;
  numChipsRequired = 0;
  hint = '';

  // Uint8Array of bytes, one byte per spot on the map
  topLayer: Uint8Array = new Uint8Array();
  bottomLayer: Uint8Array = new Uint8Array();

  // list of Creature objects (afaict monster order isn't used in lynx, so this is really editor only)
  creatures: Creature[] = [];

  trapLinks: Link[] = [];
  cloneLinks: Link[] = [];

  constructor(levelNum: number) {
    this.levelNumber = levelNum;
  }

  initialize(tile = CC.FLOOR.code) {
    this.topLayer = new Uint8Array(DEFAULT_LEVEL_SIZE * DEFAULT_LEVEL_SIZE).fill(tile);
    this.bottomLayer = new Uint8Array(DEFAULT_LEVEL_SIZE * DEFAULT_LEVEL_SIZE).fill(tile);
  }
}
