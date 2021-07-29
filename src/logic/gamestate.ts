/*
 * Adapted for Typescript from Tile World source code.
 *
 * Copyright (C) 2001-2021 by Brian Raiter,
 * under the GNU General Public License. No warranty. See COPYING for details.
 */

import { Dir } from './dir';
import { Prng } from './random';
import { TW, CCtoTW, TWtoCC } from './twtile';
import { DEFAULT_LEVEL_SIZE, FRAMES_PER_STEP, STEPS_PER_SECOND, TICKS_PER_STEP, Link } from '../util/utils';
import { Level } from './level';
import { FS_CLAIMED } from './lynx';  // eslint-disable-line import/no-cycle
import { Creature } from './creature';

/* A tile on the map.
*/
export class Mapcell {
  top = TW.Empty;   /* the upper tile */
  bottom = TW.Empty;   /* the lower tile */
  state = 0;  /* internal state flags */

  constructor(other?: Mapcell) {
    if (other) {
      this.top = other.top;
      this.bottom = other.bottom;
      this.state = other.state;
    }
  }
}

type DirProvider = { getNextDir: (state: GameState) => number };

export class GameState {
  timelimitticks = 0;           /* maximum time permitted */
  currenttime = 0;              /* the current tick count */
  nextDirProvider?: DirProvider = undefined;  /* must provide a function 'getNextDir' (which will be passed this state) */
  chipsNeeded = 0;              /* no. of chips still needed */
  statusflags = 0;              /* flags (see below) */
  nextrndslidedir = Dir.N;      /* initial random-slide dir */
  stepping = 0;                 /* initial timer offset 0-7 */
  soundeffects = [];            /* the latest sound effects */
  mainprng = new Prng();        /* the main PRNG */
  creatures: Creature[] = [];   /* the creature list */
  trapLinks: Link[] = [];       /* list of trap wirings */
  cloneLinks: Link[] = [];      /* list of cloner wirings */
  hinttext = '';                /* text of the hint */
  map: Mapcell[] = [];          /* the game's map */

  // lynx-only
  chiptocr: Creature | null = null; /* is Chip colliding with a creature */
  chiptopos = -1;                   /* just starting to move itself? */
  chiplastmovetime = 0;             /* the last time at which chip initiated a successful move */
  prng1 = 0;                        /* the values used to make the */
  prng2 = 0;                        /* pseudorandom number sequence */
  endgametimer = 0;                 /* end-game countdown timer */
  togglestate = false;              /* extra state of the toggle walls */
  completed = false;                /* level completed successfully */
  stuck = false;                    /* Chip is stuck */
  pushing = false;                  /* Chip is pushing against something */
  couldntmove = false;              /* can't-move sound has been played */

  // chipMovedCallback?: Function;
  mapUpdatedCallback?: Function;
  removeCreatureCallback?: Function;

  constructor() {
    this.map = new Array(DEFAULT_LEVEL_SIZE * DEFAULT_LEVEL_SIZE);
    for (let i = 0; i < DEFAULT_LEVEL_SIZE * DEFAULT_LEVEL_SIZE; i++) this.map[i] = new Mapcell(undefined);
  }

  /*
   * The pseudorandom number generator, used by walkers and blobs. This
   * exactly matches the PRNG used in the original Lynx game.
   * [tb] afaict it's used for walkers only, and it's here (instead of random.ts)
   * because it's mutating this state, and it's quite different than
   * the random functions in random.js
   */
  lynx_prng() {
    let n = (this.prng1 >> 2) - this.prng1;
    if (!(this.prng1 & 0x02)) --n;
    if (n < 0) n = 0x100 + n;                     // added this line to clamp n to 0-255
    this.prng1 = (this.prng1 >> 1) | (this.prng2 & 0x80);
    this.prng2 = ((this.prng2 << 1) & 0xFF) | (n & 0x01);   // added the & 0xFF to similarly clamp prng2
    return (this.prng1 ^ this.prng2) & 0xFF;
  }

  // ------------------------------
  // stuff I added to be able to use same GameBoard.jsx

  levelNumber = 0;
  title = '';
  timeLimit = 0;
  password = '';
  gameOver = 0;

  topCode(index: number): number {
    return TWtoCC[this.map[index].top];
  }

  bottomCode(index: number): number {
    return TWtoCC[this.map[index].bottom];
  }

  countChips() {
    return this.map.reduce((count, cell) => (cell.top === TW.ICChip || cell.bottom === TW.ICChip ? count + 1 : count), 0);
  }

  decChipsNeeded() {
    this.chipsNeeded -= 1;
  }

  setChipsNeeded(n: number) {
    this.chipsNeeded = n;
  }

  setGameOver(b: number) {
    this.gameOver = b;
  }

  chip() {
    return this.creatures[0];
  }

  // logic duplicated from lynx.ts
  toggleWalls() {
    const t = (this.togglestate ? 1 : 0) ^ TW.SwitchWall_Open ^ TW.SwitchWall_Closed;
    for (let pos = 0; pos < this.map.length; ++pos) {
      if (this.map[pos].top === TW.SwitchWall_Open || this.map[pos].top === TW.SwitchWall_Closed) {
        this.map[pos].top ^= t;
      }
    }
  }

  addCreature(cr: Creature) {
    this.map[cr.pos].state |= FS_CLAIMED;
    this.creatures.push(cr);
  }

  removeCreature(cr: Creature) {
    // cr.hidden = true;
    this.map[cr.pos].state &= ~FS_CLAIMED;
    this.creatures = this.creatures.filter((e) => e !== cr);
  }

  getTimeLeft() {
    if (!Number.isNaN(this.timelimitticks) && this.timelimitticks > 0) {
      return Math.ceil((this.timelimitticks - this.currenttime) / (STEPS_PER_SECOND * FRAMES_PER_STEP));
    }
    return -1;
  }
}

export function levelToGameState(level: Level) {
  const state = new GameState();

  state.title = level.title;
  state.levelNumber = level.levelNumber;
  state.password = level.password;
  state.hinttext = level.hint;
  state.chipsNeeded = level.numChipsRequired;
  state.timeLimit = level.timeLimit;
  state.timelimitticks = state.timeLimit * STEPS_PER_SECOND * TICKS_PER_STEP;

  for (let i = 0; i < DEFAULT_LEVEL_SIZE * DEFAULT_LEVEL_SIZE; i++) {
    state.map[i].top = CCtoTW[level.topLayer[i]];
    state.map[i].bottom = CCtoTW[level.bottomLayer[i]];
  }

  state.trapLinks.push(...level.trapLinks);

  state.cloneLinks.push(...level.cloneLinks);

  return state;
}
