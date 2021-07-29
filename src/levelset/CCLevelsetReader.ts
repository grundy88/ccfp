import { isChip, isMonster, CC } from '../logic/tile';
import { Level } from '../logic/level';
import { DEFAULT_LEVEL_SIZE, layerIndexForPoint, pointForLayerIndex, Location } from '../util/utils';
import { CCtoTW } from '../logic/twtile';
import { Creature } from '../logic/creature';

// https://www.seasip.info/ccfile.html

// Kind of an iterator over level data, passed as a byte array
class LevelsetReader {
  data: Uint8Array;
  offset: number;

  constructor(data: Uint8Array, startOffset = 0x04) {
    this.data = data;
    this.offset = startOffset;
  }

  getNumber = (bytes: Uint8Array, offset: number, len: number) => {
    let ret = 0;
    for (let i = 0; i < len; i++) {
      // eslint-disable-next-line no-bitwise
      ret += bytes[i + offset] << (8 * i);
    }
    return ret;
  };

  getOffset() { return this.offset; }

  incOffset(n: number) { this.offset += n; }

  // reads the next number and then reads that many bytes
  // result includes the initial numBytes word
  // *does not* advance the reader
  peekNextNumberOfBytes(numBytes: number) {
    const n = this.getNumber(this.data, this.offset, numBytes);
    return this.data.subarray(this.offset, this.offset + numBytes + n);
  }

  // reads the next number and then skips that many bytes
  skipNextNumberOfBytes(numBytes: number) {
    const n = this.getNumber(this.data, this.offset, numBytes);
    this.offset += numBytes + n;
  }

  nextNumber(numBytes = 2) {
    const n = this.getNumber(this.data, this.offset, numBytes);
    this.offset += numBytes;
    return n;
  }

  nextString() {
    const strlen = this.nextNumber(1);
    // ignore trailing \0
    // eslint-disable-next-line prefer-spread
    const s = String.fromCharCode.apply(String, this.data.subarray(this.offset, this.offset + strlen - 1) as unknown as number[]);
    this.offset += strlen;
    return s;
  }

  nextPassword() {
    const strlen = this.nextNumber(1);
    // ignore trailing \0
    const a = this.data.subarray(this.offset, this.offset + strlen - 1);
    this.offset += strlen;
    let password = '';
    for (let i = 0; i < a.length; i++) {
      // eslint-disable-next-line no-bitwise
      password += String.fromCharCode(a[i] ^ 0x99);
    }
    return password;
  }
}

// Setup level top and bottom layers.
// * Chip, block, and trap objects are set up here
//   because there is no separate field in the data file.
// * Blocks are added to the movable layer and never to
//   the top layer.
// * Monsters are set up during monster field processing.
//   Monsters not represented in the monster field are non-moving
//   so they'll appear as normal layer objects (but they can still
//   kill, so that check needs to happen during the game).
// * Traps not represented in the trap field still function,
//   but can never be released.
function processLayerObject(level: Level, objectCode: number, index: number, isTop: boolean) {
  const [x, y] = pointForLayerIndex(index);

  if (isChip(objectCode)) {
    // CHIP
    if (isTop) {
      // if (level.chip) {
      //   // previous chip becomes stationary
      //   console.log(`WARNING: multiple Chips, ignoring previous at ${level.chip.x},${level.chip.y}`);
      //   var prevChipIndex = layerIndexForPoint(level.chip.x, level.chip.y);
      //   level.topLayer[prevChipIndex] = Tile.CHIP_S.code;
      // }
      // level.chip = new Chip(level, x, y, objectCode);
      // todo gameplay would need layer mutation
      level.topLayer[index] = objectCode;
    } else {
      console.log(`WARNING: Chip on bottom layer at ${x},${y}`);
      level.bottomLayer[index] = CC.CHIP_S.code;
    }
  } else if (objectCode === CC.BLOCK.code) {
    if (isTop) {
      // todo memory
      // const block = new Block(level, x, y);
      // level.blocks.push(block);
      // level.movableObjects.push(block);
      // todo gameplay would need layer mutation
      level.topLayer[index] = CC.BLOCK.code;
    } else {
      console.log(`WARNING: block on bottom layer at ${x},${y}`);
      level.bottomLayer[index] = CC.BLOCK.code;
    }
  } else if (objectCode === CC.TRAP.code) {
    // todo memory
    // level.traps.push(new Trap(level, x, y));
    const layer = isTop ? level.topLayer : level.bottomLayer;
    layer[index] = CC.TRAP.code;
  } else {
    const layer = isTop ? level.topLayer : level.bottomLayer;
    layer[index] = objectCode;
  }

  // todo gameplay would need layer mutation
  // anything under a block (except another block) gets promoted to the top
  // this assumes top layer processing happened already
  // if (!isTop
  //   && level.movableObjects[index] !== undefined
  //   && level.movableObjects[index].constructor.name === 'Block')
  // {
  //     console.log(`[objectCode] ${objectCode.toString(16)}`);
  //     if (objectCode !== Tile.BLOCK.code) {
  //         level.topLayer[index] = objectCode;
  //     }
  //     level.bottomLayer[index] = Tile.FLOOR.code;
  // }
}

function loadLayer(reader: LevelsetReader, level: Level, isTop: boolean) {
  const numBytesInLayer = reader.nextNumber();
  const layerEnd = reader.getOffset() + numBytesInLayer;
  let index = 0;

  while (reader.getOffset() < layerEnd) {
    const objectCode = reader.nextNumber(1);

    if (objectCode >= 0x00 && objectCode <= 0x6F) {
      // single object
      processLayerObject(level, objectCode, index, isTop);
      index += 1;
    } else if (objectCode === 0xFF) {
      // RLE
      const objectCount = reader.nextNumber(1);
      const rleObjectCode = reader.nextNumber(1);
      for (let i = 0; i < objectCount; i++) {
        processLayerObject(level, rleObjectCode, index, isTop);
        index += 1;
      }
    }
  }

  if (index !== (DEFAULT_LEVEL_SIZE * DEFAULT_LEVEL_SIZE)) {
    throw new Error(`error: only got ${index} objects`);
  }
}

function loadTrapControls(reader: LevelsetReader, level: Level) {
  const trapBytes = reader.nextNumber(1);
  if (trapBytes % 0x0A !== 0) {
    throw new Error(`error: trap bytes (${trapBytes}) not divisible by 0x0A`);
  }
  const trapCount = trapBytes / 0x0A;
  for (let i = 0; i < trapCount; i++) {
    const buttonx = reader.nextNumber();
    const buttony = reader.nextNumber();
    const trapx = reader.nextNumber();
    const trapy = reader.nextNumber();
    // next word is always zero (used in the game for open/closed?)
    reader.nextNumber();

    const buttonIndex = layerIndexForPoint(buttonx, buttony);
    const trapIndex = layerIndexForPoint(trapx, trapy);
    if (level.topLayer[buttonIndex] === CC.BROWN_BUTTON.code || level.bottomLayer[buttonIndex] === CC.BROWN_BUTTON.code) {
      if (level.topLayer[trapIndex] === CC.TRAP.code || level.bottomLayer[trapIndex] === CC.TRAP.code) {
        level.trapLinks.push({ from: new Location(buttonx, buttony), to: new Location(trapx, trapy) });
      } else {
        console.log(`WARNING: button at ${buttonx},${buttony} does not trigger a trap on the map at ${trapx},${trapy}`);
      }
    } else {
      console.log(`WARNING: button at ${buttonx},${buttony} does not correspond to a trap button`);
    }
    console.log(`button at ${buttonx},${buttony} controls trap at ${trapx},${trapy}`);
  }
}

function loadCloneMachineControls(reader: LevelsetReader, level: Level) {
  const cloneBytes = reader.nextNumber(1);
  if (cloneBytes % 0x08 !== 0) {
    throw new Error(`error: clone bytes (${cloneBytes}) not divisible by 0x08`);
  }
  const cloneCount = cloneBytes / 0x08;
  for (let i = 0; i < cloneCount; i++) {
    const buttonx = reader.nextNumber();
    const buttony = reader.nextNumber();
    const machinex = reader.nextNumber();
    const machiney = reader.nextNumber();

    const buttonIndex = layerIndexForPoint(buttonx, buttony);
    const machineIndex = layerIndexForPoint(machinex, machiney);
    if (level.topLayer[buttonIndex] === CC.RED_BUTTON.code || level.bottomLayer[buttonIndex] === CC.RED_BUTTON.code) {
      const t = level.topLayer[machineIndex];
      const b = level.bottomLayer[machineIndex];
      if (b === CC.CLONE_MACHINE.code
          || t === CC.CLONE_BLOCK_N.code
          || t === CC.CLONE_BLOCK_W.code
          || t === CC.CLONE_BLOCK_S.code
          || t === CC.CLONE_BLOCK_E.code) {
        level.cloneLinks.push({ from: new Location(buttonx, buttony), to: new Location(machinex, machiney) });
      } else {
        console.log(`WARNING: button at ${buttonx},${buttony} does not trigger a machine on the map at ${machinex},${machiney}`);
      }
    } else {
      console.log(`WARNING: button at ${buttonx},${buttony} does not correspond to a clone button`);
    }
  }
}

function loadMonsters(reader: LevelsetReader, level: Level) {
  const monsterBytes = reader.nextNumber(1);
  if (monsterBytes % 2 !== 0) {
    throw new Error(`error: monster bytes (${monsterBytes}) not divisible by 2`);
  }
  const monsterCount = monsterBytes / 2;
  for (let i = 0; i < monsterCount; i++) {
    // yep these coords are single bytes
    const monsterx = reader.nextNumber(1);
    const monstery = reader.nextNumber(1);

    const monsterIndex = layerIndexForPoint(monsterx, monstery);
    const monsterCode = level.topLayer[monsterIndex];
    if (isMonster(monsterCode)) {
      const monster = new Creature();
      monster.pos = monsterIndex;
      monster.id = CCtoTW[monsterCode];
      level.creatures.push(monster);
    } else {
      console.log(`WARNING: no monster at ${monsterx}, ${monstery}`);
    }
  }
}

function _loadLevel(reader: LevelsetReader, shouldLoadGamePlayElements = true) {
  const numBytesInLevel = reader.nextNumber(2);
  const levelEnd = reader.getOffset() + numBytesInLevel;

  const levelNumber = reader.nextNumber(2);
  const level = new Level(levelNumber);

  level.timeLimit = reader.nextNumber(2);
  level.numChipsRequired = reader.nextNumber(2);

  const fieldNum = reader.nextNumber(2);
  if (fieldNum !== 1) {
    throw new Error(`error: unexpected first fieldNum ${fieldNum}`);
  }

  if (shouldLoadGamePlayElements) {
    level.initialize();

    loadLayer(reader, level, true);
    loadLayer(reader, level, false);
  } else {
    reader.skipNextNumberOfBytes(2);
    reader.skipNextNumberOfBytes(2);
  }

  // remaining fields
  const numOptionalBytes = reader.nextNumber(2);
  if (levelEnd !== reader.getOffset() + numOptionalBytes) {
    throw new Error(`error: end of level check (${levelEnd} !== ${reader.getOffset() + numOptionalBytes})`);
  }

  const fieldFunctions = new Map();
  fieldFunctions.set(3, () => { level.title = reader.nextString(); });
  fieldFunctions.set(4, () => (shouldLoadGamePlayElements ? loadTrapControls(reader, level) : reader.skipNextNumberOfBytes(1)));
  fieldFunctions.set(5, () => (shouldLoadGamePlayElements ? loadCloneMachineControls(reader, level) : reader.skipNextNumberOfBytes(1)));
  fieldFunctions.set(6, () => { level.password = reader.nextPassword(); });
  fieldFunctions.set(7, () => { level.hint = reader.nextString(); });
  fieldFunctions.set(10, () => (shouldLoadGamePlayElements ? loadMonsters(reader, level) : reader.skipNextNumberOfBytes(1)));

  while (reader.getOffset() < levelEnd) {
    const f = reader.nextNumber(1);
    if (fieldFunctions.get(f)) {
      fieldFunctions.get(f)();
    } else {
      console.log(`warning: ignoring unknown field num ${f}`);
    }
  }

  // console.log(level.title);
  // console.log(`Password: ${level.password}`);
  // if (shouldLoadGamePlayElements) {
  // console.log(`Chip at ${level.chip.x},${level.chip.y}`);
  // console.log(`num blocks: ${level.blocks.length}`);
  // console.log(`num traps: ${level.traps.length}`);
  // console.log(`num monsters: ${level.creatures.length}`);
  // }

  return level;
}

function loadLevelFromLevelset(levelsetBytes: Uint8Array, num: number) {
  const reader = new LevelsetReader(levelsetBytes);
  const numLevels = reader.nextNumber(2);
  if (numLevels < num) {
    throw new Error(`error: cannot load level ${num} from file with ${numLevels} levels`);
  }

  for (let n = 1; n < num; n++) {
    reader.skipNextNumberOfBytes(2);
  }

  return _loadLevel(reader);
}

function loadLevel(levelBytes: Uint8Array) {
  const reader = new LevelsetReader(levelBytes, 0);
  const level = _loadLevel(reader);
  // level.sourceBytes = levelBytes;
  return level;
}

// Returns an array of {title, bytes}
// Ignores everything else
function loadLevelset(levelsetBytes: Uint8Array) {
  // const start = performance.now();
  const levels = [];
  const reader = new LevelsetReader(levelsetBytes, 0);
  // console.log(levelsetBytes);
  const magic = reader.nextNumber(4);
  if (magic !== 174764 && magic !== 16951980) {
    throw new Error(`error: not a valid Chip's Challenge file: ${magic}`);
  }
  const numLevels = reader.nextNumber(2);

  while (reader.getOffset() < levelsetBytes.length) {
    // console.log(`-------- LEVEL ${levels.length + 1}`);
    // grab level bytes
    // const levelBytes = reader.peekNextNumberOfBytes(2);
    // then read the level to extract title
    const level = _loadLevel(reader, false);
    // console.log(`-------- LEVEL ${level.levelNumber}: ${level.title}`);
    // if (level.levelNumber === 5) console.log(levelBytes);
    const listLevel = new Level(level.levelNumber);
    listLevel.title = level.title;
    // listLevel.sourceBytes = levelBytes;
    levels.push(listLevel);
  }

  if (numLevels !== levels.length) {
    throw new Error(`error: expected ${numLevels} levels but read ${levels.length}`);
  }
  // console.log(`levelset load took ${performance.now()-start}ms`);

  return levels;
}

// function loadLevelInfo(data) {
//     var levelInfos = []
//     const reader = new LevelsetReader(data)
//     const numLevels = reader.nextNumber(2)

//     while (reader.getOffset() < data.length) {
//     // for (levelNum of range(1, numLevels+1)) {
//         const numBytesInLevel = reader.nextNumber(2)
//         const levelEnd = reader.getOffset() + numBytesInLevel

//         // level info
//         const levelInfo = {}
//         levelInfos.push(levelInfo)

//         levelInfo.levelNumber = reader.nextNumber(2)
//         levelInfo.timeLimit = reader.nextNumber(2)
//         levelInfo.numChipsRequired = reader.nextNumber(2)

//         const fieldNum = reader.nextNumber(2)
//         if (fieldNum !== 1) {
//             throw `error: unexpected first fieldNum ${fieldNum}`
//         }

//         // skip the two layer details
//         reader.skipNextNumberOfBytes(2)
//         reader.skipNextNumberOfBytes(2)

//         // remaining fields
//         const numOptionalBytes = reader.nextNumber(2)
//         if (levelEnd !== reader.getOffset() + numOptionalBytes) {
//             throw `error: end of level check (${levelEnd}, ${reader.getOffset() + numOptionalBytes}`
//         }

//         while (reader.getOffset() < levelEnd) {
//             const fieldNum = reader.nextNumber(1)
//             switch(fieldNum) {
//                 case 3:
//                     levelInfo.title = reader.nextString()
//                     break;
//                 case 6:
//                     levelInfo.password = reader.nextPassword()
//                     break;
//                 case 4: // trap controls
//                 case 5: // clone machine controls
//                 case 7: // hint
//                 case 10: // monsters
//                     reader.skipNextNumberOfBytes(1)
//                     break
//             }
//         }
//     }

//     if (numLevels !== levelInfos.length) {
//         throw `error: expected ${numLevels} levels but read ${levelInfos.length}`
//     }

//     return levelInfos
// }

// function processEntry(entry) {
//   const levels = loadLevelset(entry.data);
//   return {name: entry.name, fileSize: entry.data.length, numLevels: levels.length};
// }

export { loadLevelset, loadLevel, loadLevelFromLevelset };    // react
// module.exports = { loadLevelset, loadLevelFromLevelset }   // node.js
