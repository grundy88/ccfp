// import { Dir } from './dir';
// import { CC, isMonster, isCloneMachine } from './tile'
// import { Creature } from './creature';
// import { Link } from './link';

// number of game engine calculations per step
// never change this, it's lynx granularity
export const TICKS_PER_STEP = 4;

// game engine speed - entities at normal speed will move this many board tiles in 1 second
// never change this, it's fairly standard
export const STEPS_PER_SECOND = 5;

// number of animation frames per step
// higher number means smoother animation
// TODO completely broken - this just changes the speed as lynx logic is set to match frames and ticks (at 4/s)
export const FRAMES_PER_STEP = 4;

export const DEFAULT_LEVEL_SIZE = 32;

export const MESH_SIZE = 32;

export function layerIndexForPoint(x: number, y: number, width = DEFAULT_LEVEL_SIZE) {
  return (y * width) + x;
}

export function pointForLayerIndex(index: number, width = DEFAULT_LEVEL_SIZE) {
  return [index % width, Math.floor(index / width)];
}

export function toCoords(index: number, width = DEFAULT_LEVEL_SIZE) {
  return `${index % width}, ${Math.floor(index / width)}`;
}

export class Location {
  x: number;
  y: number;
  disabled = false;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  index() {
    return layerIndexForPoint(this.x, this.y);
  }
}

export type Link = { from: Location, to: Location };

// ------------------------------------------------------------------

/* A list of ways for Chip to lose.
 */
export const EndReasons = Object.freeze({
  Exit: 1,
  Time: 2,
  Monster: 3,
  Block: 4,
  Fire: 5,
  Water: 6,
  Bomb: 7,
});

const MESSAGES_EXIT = ['You made it!', 'Absolutely Nice!', 'Good job!'];
const MESSAGES_TIME = ['Out of time!', 'Took too long!'];

function randomMessage(a: string[]) {
  return a[Math.floor(Math.random() * a.length)];
}

export function gameOverMessageForReason(reason: number) {
  switch (reason) {
    case EndReasons.Exit: return randomMessage(MESSAGES_EXIT);
    case EndReasons.Time: return randomMessage(MESSAGES_TIME);
    case EndReasons.Monster: return 'Ooops! Look out for creatures!';
    case EndReasons.Block: return 'Ooops! Watch out for moving blocks!';
    case EndReasons.Fire: return "Ooops! Don't step in the fire without fire boots!";
    case EndReasons.Water: return "Ooops! You can't swim without flippers!";
    case EndReasons.Bomb: return "Ooops! Don't touch the bombs!";
    default: return null;
  }
}

// ------------------------------------------------------------------

export function loadBinaryAsset(file: string) {
  return new Promise((resolve) => {
    import(`../assets/${file}`).then((path) => {
      // todo there has got to be a better way
      const request = new XMLHttpRequest();
      request.open('GET', path.default, true);
      request.responseType = 'blob';
      request.onload = () => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(request.response);
        reader.onload = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
      };
      request.send();
    });
  });
}
