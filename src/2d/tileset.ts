import { Dir } from '../logic/dir';
import { CC, Tile, isTransparent, isUnused, isDirectionalForce } from '../logic/tile';
// import { TWATileset } from './twatileset';

const TILE_SIZE = 32;

// ----------------------------------------------------------------

const ARROW_HEIGHT = 8;
const ARROW_WIDTH = 16;
const ARROW_OFFSET = 1;
const _arrowPaths = {
  [Dir.N]: (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE / 2, y + ARROW_OFFSET);
    ctx.lineTo(x + TILE_SIZE / 2 + ARROW_WIDTH / 2, y + ARROW_OFFSET + ARROW_HEIGHT);
    ctx.lineTo(x + TILE_SIZE / 2 - ARROW_WIDTH / 2, y + ARROW_OFFSET + ARROW_HEIGHT);
    ctx.fill();
  },
  [Dir.W]: (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x + ARROW_OFFSET, y + TILE_SIZE / 2);
    ctx.lineTo(x + ARROW_OFFSET + ARROW_HEIGHT, y + TILE_SIZE / 2 + ARROW_WIDTH / 2);
    ctx.lineTo(x + ARROW_OFFSET + ARROW_HEIGHT, y + TILE_SIZE / 2 - ARROW_WIDTH / 2);
    ctx.fill();
  },
  [Dir.S]: (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE / 2, y + TILE_SIZE - ARROW_OFFSET);
    ctx.lineTo(x + TILE_SIZE / 2 + ARROW_WIDTH / 2, y + TILE_SIZE - ARROW_OFFSET - ARROW_HEIGHT);
    ctx.lineTo(x + TILE_SIZE / 2 - ARROW_WIDTH / 2, y + TILE_SIZE - ARROW_OFFSET - ARROW_HEIGHT);
    ctx.fill();
  },
  [Dir.E]: (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE - ARROW_OFFSET, y + TILE_SIZE / 2);
    ctx.lineTo(x + TILE_SIZE - ARROW_OFFSET - ARROW_HEIGHT, y + TILE_SIZE / 2 + ARROW_WIDTH / 2);
    ctx.lineTo(x + TILE_SIZE - ARROW_OFFSET - ARROW_HEIGHT, y + TILE_SIZE / 2 - ARROW_WIDTH / 2);
    ctx.fill();
  },
};

export function drawArrow(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number) {
  ctx.fillStyle = 'black';
  if (tile.arrow) {
    _arrowPaths[tile.arrow](ctx, x, y);
  }
}

export function drawNumber(ctx: CanvasRenderingContext2D, num: string, x: number, y: number) {
  const radius = 7;
  const numx = x + TILE_SIZE - radius;
  const numy = y + TILE_SIZE - radius;
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(numx, numy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '10px sans-serif';
  ctx.fillStyle = 'white';
  ctx.fillText(num, numx, numy);
}

class TileSet {
  // ----------------------------------------------------------------
  // image manipulation

  // get rectangle from source image, return new canvas
  _crop(source: InstanceType<typeof Image>, x: number, y: number, width: number, height: number) {
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    const ctx = buffer.getContext('2d')!;
    ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
    return buffer;
  }

  // return canvas to use as a mask by examining source image
  _createMask(source: HTMLCanvasElement) {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(0, 0, source.width, source.height);
    let i = 0;
    while ((i + 3) < data.data.length) {
      const rgb = data.data[i++] + data.data[i++] + data.data[i++];
      // set the alpha channel depending on the rgb
      // white (rgb(255,255,255)) ends up opaque, black ends up transparent
      data.data[i++] = rgb / 3;
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
  }

  // return canvas containing source image masked with mask image
  _mask(source: HTMLCanvasElement, mask: HTMLCanvasElement) {
    const buffer = document.createElement('canvas');
    buffer.width = source.width;
    buffer.height = source.height;
    const ctx = buffer.getContext('2d')!;
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(source, 0, 0);
    return buffer;
  }

  // directly modify source image
  // find all pixels of color rgb and make them transparent
  _makeTransparent(source: HTMLCanvasElement, rgb: number[]) {
    const ctx = source.getContext('2d')!;
    const data = ctx.getImageData(0, 0, source.width, source.height);
    let i = 0;
    while ((i + 3) < data.data.length) {
      const r = data.data[i++];
      const g = data.data[i++];
      const b = data.data[i++];
      data.data[i++] = ((r === rgb[0]) && (g === rgb[1]) && (b === rgb[2])) ? 0 : 255;
    }
    ctx.putImageData(data, 0, 0);
    return source;
  }

  // ----------------------------------------------------------------
  // tile manipulation

  _buildFakeBlueWall(tileimage: InstanceType<typeof Image>) {
    const blueWall = this._extractTile(tileimage, CC.BLUE_BLOCK_WALL.code);
    const floor = this._extractSeethrough(tileimage, CC.FLOOR.code, 3);
    const ctx = blueWall.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(floor, 0, 0);
    return blueWall;
  }

  _buildInvisibleWall(tileimage: InstanceType<typeof Image>) {
    const wall = this._extractTile(tileimage, CC.WALL.code);
    const ctx = wall.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = '#FFFFFF99';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    return wall;
  }

  _buildAppearingWall(tileimage: InstanceType<typeof Image>) {
    const wall = this._extractTile(tileimage, CC.WALL.code);
    const ctx = wall.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';

    // partially disappearing wall
    const grd = ctx.createLinearGradient(0, (TILE_SIZE / 8) * 3, 0, TILE_SIZE);
    grd.addColorStop(0, '#FFFFFFaa');
    grd.addColorStop(1, '#FFFFFF00');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // opaque X across the middle
    // const w = 8;
    // ctx.fillStyle = "#FFFFFF88";
    // ctx.beginPath();
    // ctx.moveTo(0, 0);
    // ctx.lineTo(TILE_SIZE-w, 0);
    // ctx.lineTo(0, TILE_SIZE-w);
    // ctx.fill();
    // ctx.beginPath();
    // ctx.moveTo(TILE_SIZE, TILE_SIZE);
    // ctx.lineTo(TILE_SIZE, w);
    // ctx.lineTo(w, TILE_SIZE);
    // ctx.fill();
    return wall;
  }

  _buildUnused(tileimage: InstanceType<typeof Image>) {
    const floor = this._extractTile(tileimage, CC.FLOOR.code);
    const ctx = floor.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = '#DD2222';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, TILE_SIZE - 8);
    ctx.lineTo(TILE_SIZE - 8, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.stroke();
    return floor;
  }

  // ----------------------------------------------------------------
  // extraction from original image

  _extractTopHalf(image: InstanceType<typeof Image>, code: number) {
    const orig = this.extractTile(image, code);
    const buffer = document.createElement('canvas');
    const { width } = orig;
    const { height } = orig;
    const extractedHeight = Math.floor(height * 0.6);
    buffer.width = width;
    buffer.height = height;
    const ctx = buffer.getContext('2d')!;
    ctx.drawImage(orig, 0, 0, width, extractedHeight, 0, (height - extractedHeight) / 2, width, extractedHeight);
    return buffer;
  }

  _extractTile(image: InstanceType<typeof Image>, code: number): HTMLCanvasElement {
    if (code === CC.BLUE_BLOCK_FLOOR.code) {
      return this._buildFakeBlueWall(image);
    } if (code === CC.INVISIBLE_WALL.code) {
      return this._buildInvisibleWall(image);
    } if (code === CC.APPEARING_WALL.code) {
      return this._buildAppearingWall(image);
    } if (isUnused(code)) {
      return this._buildUnused(image);
    }

    return this.extractTile(image, code);
  }

  _extractSeethrough(image: InstanceType<typeof Image>, code: number, border = 8) {
    const mask = document.createElement('canvas');
    mask.width = TILE_SIZE;
    mask.height = TILE_SIZE;
    const maskCtx = mask.getContext('2d')!;

    // gradient mask: tile too small to really see gradient
    // var grd = maskCtx.createRadialGradient(TILE_SIZE/2, TILE_SIZE/2, 8, TILE_SIZE/2, TILE_SIZE/2, 16);
    // grd.addColorStop(0, "#000000FF");
    // grd.addColorStop(1, "#00000000");
    // maskCtx.fillStyle = grd;

    maskCtx.fillStyle = '#000000FF';
    // maskCtx.fillRect(TILE_SIZE/4, TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);
    maskCtx.fillRect(border, border, TILE_SIZE - 2 * border, TILE_SIZE - 2 * border);
    // maskCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // maskCtx.fillRect(0, 0, border*2, border*2);

    // circle mask: didn't look as good as a square hole
    // maskCtx.beginPath();
    // maskCtx.fillStyle = grd;
    // maskCtx.arc(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE, 0, 2 * Math.PI);
    // maskCtx.fill();

    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    ctx.drawImage(this._extractTile(image, code), 0, 0);
    // ctx.drawImage(this._crop(image, tileX, tileY, TILE_SIZE, TILE_SIZE), 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'darkgray';
    ctx.lineWidth = 1;
    ctx.strokeRect(border, border, TILE_SIZE - 2 * border, TILE_SIZE - 2 * border);
    return c;
  }

  _getSeethroughImage(image: InstanceType<typeof Image>, t: Tile) {
    if (isTransparent(t.code)) return null;
    const i = this._extractSeethrough(image, t.code);
    return i;
  }

  // ----------------------------------------------------------------
  // overlays

  _drawIllegalOverlay() {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = '#FF0000AA';
    ctx.beginPath();
    ctx.arc(5, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(5, 1);
    ctx.lineTo(9, 7.5);
    ctx.lineTo(1, 7.5);
    ctx.fill();

    // ctx.textAlign = "center";
    // ctx.textBaseline = "middle";
    // ctx.font = "8px sans-serif";
    // ctx.strokeText("!", 5, 5);
    return c;
  }

  _rollVert(source: HTMLCanvasElement, y: number) {
    const buffer = document.createElement('canvas');
    const w = source.width;
    const h = source.height;
    buffer.width = w;
    buffer.height = h;
    const ctx = buffer.getContext('2d')!;
    ctx.drawImage(source, 0, 0, w, y, 0, h - y, w, y);
    ctx.drawImage(source, 0, y, w, h - y, 0, 0, w, h - y);
    return buffer;
  }

  _rollHoriz(source: HTMLCanvasElement, x: number) {
    const buffer = document.createElement('canvas');
    const w = source.width;
    const h = source.height;
    buffer.width = w;
    buffer.height = h;
    const ctx = buffer.getContext('2d')!;
    ctx.drawImage(source, 0, 0, x, h, w - x, 0, x, h);
    ctx.drawImage(source, x, 0, w - x, h, 0, 0, w - x, h);
    return buffer;
  }

  _roll(source: HTMLCanvasElement, x: number, y: number) {
    let buffer = source;
    if (x !== 0) buffer = this._rollHoriz(buffer, x);
    if (y !== 0) buffer = this._rollVert(buffer, y);
    return buffer;
  }

  extractTile(image: InstanceType<typeof Image>, code: number) {
    const tileCol = Math.floor(code / 16);
    const tileRow = (code % 16);
    const tileX = tileCol * TILE_SIZE;
    const tileY = tileRow * TILE_SIZE;
    if (tileCol <= 3) {
      return this._crop(image, tileX, tileY, TILE_SIZE, TILE_SIZE);
    }
    const maskCol = tileCol + 6;
    const maskX = maskCol * TILE_SIZE;
    const mask = this._createMask(this._crop(image, maskX, tileY, TILE_SIZE, TILE_SIZE));
    const content = this._crop(image, tileX, tileY, TILE_SIZE, TILE_SIZE);
    return this._mask(content, mask);
  }

  // ----------------------------------------------------------------
  // public functions

  image: InstanceType<typeof Image>;
  tiles: Map<number, any>;

  illegalOverlay: HTMLCanvasElement;
  chipSwimming: any;

  constructor(image: InstanceType<typeof Image>) {
    this.image = image;
    this.tiles = new Map();
    Object.values(CC).forEach((t) => {
      // fake some animation by rolling tile images
      if (isDirectionalForce(t.code)) {
        const ff = this.extractTile(image, t.code);
        // bit of a hack, the ww tiles look better faster
        const parts = image.src.indexOf('tiles-ww') > 0 ? 16 : 8;
        let f;
        switch (t.code) {
          case CC.FORCE_N.code: f = (p: number) => this._roll(ff, 0, TILE_SIZE * p / parts); break;
          case CC.FORCE_S.code: f = (p: number) => this._roll(ff, 0, TILE_SIZE - TILE_SIZE * (p + 1) / parts); break;
          case CC.FORCE_W.code: f = (p: number) => this._roll(ff, TILE_SIZE * p / parts, 0); break;
          default: f = (p: number) => this._roll(ff, TILE_SIZE - TILE_SIZE * (p + 1) / parts, 0); break;
        }
        const tiles = [];
        for (let part = 0; part < parts; part++) {
          tiles.push(f(part));
        }
        this.tiles.set(t.code, {
          tiles,
          seethrough: this._getSeethroughImage(image, t),
        });
      } else if (t.code === CC.WATER.code) {
        const ff = this.extractTile(image, t.code);
        const parts = 32;
        const tiles = [];
        for (let part = parts - 1; part >= 0; part--) {
          tiles.push(this._roll(ff, TILE_SIZE * part / parts, TILE_SIZE * part / parts));
        }
        this.tiles.set(t.code, {
          tiles,
          seethrough: this._getSeethroughImage(image, t),
        });
      } else {
        this.tiles.set(t.code, {
          tiles: [this._extractTile(image, t.code)],
          seethrough: this._getSeethroughImage(image, t),
        });
      }
    });

    this.illegalOverlay = this._drawIllegalOverlay();

    this.chipSwimming = {
      [CC.CHIP_SWIMMING_N.code]: this._extractTopHalf(image, CC.CHIP_SWIMMING_N.code + 48),
      [CC.CHIP_SWIMMING_W.code]: this._extractTopHalf(image, CC.CHIP_SWIMMING_W.code + 48),
      [CC.CHIP_SWIMMING_S.code]: this._extractTopHalf(image, CC.CHIP_SWIMMING_S.code + 48),
      [CC.CHIP_SWIMMING_E.code]: this._extractTopHalf(image, CC.CHIP_SWIMMING_E.code + 48),
    };

    // // all tilesets currently using the same splash/explosion/collision animations
    // import(`../../assets/tiles-anim-tw.png`).then(tileImage => {
    //   const i = new Image();
    //   i.src = tileImage.default;
    //   i.onload = () => {
    //     this.animations = new TWATileset(i);
    //   };
    // });
  }

  drawTile(ctx: CanvasRenderingContext2D, code: number, x: number, y: number, frame = 0) {
    const index = frame % this.tiles.get(code).tiles.length;
    ctx.drawImage(this.tiles.get(code).tiles[index], x, y);
  }

  drawSeethroughTile(ctx: CanvasRenderingContext2D, code: number, x: number, y: number) {
    ctx.drawImage(this.tiles.get(code).seethrough, x, y);
  }

  drawSwimming(ctx: CanvasRenderingContext2D, code: number, x: number, y: number) {
    ctx.drawImage(this.chipSwimming[code - 48], x, y);
  }

  // drawAnimation(ctx: CanvasRenderingContext2D, code, x: number, y: number, frame=0) {
  //   this.animations.drawTile(ctx, code, x: number, y: number, frame);
  // }
}

export { TileSet, TILE_SIZE };
