import React, { useCallback } from 'react';
import { TILE_SIZE } from '../2d/tileset'

const TileImage = ({tileset, tile, size=TILE_SIZE, onTile, num}) => {

  const canvas = useCallback(c => {
    if (c !== null && tileset) {
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.scale(size / TILE_SIZE, size / TILE_SIZE);
      ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
      if (onTile) tileset.drawTile(ctx, onTile.code, 0, 0);
      tileset.drawTile(ctx, tile.code, 0, 0);

      if (num > 1) {
        const radius = 7;
        const cx = TILE_SIZE - radius;
        const cy = radius;
        ctx.fillStyle = "pink";
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "12px sans-serif";
        ctx.strokeText(num, cx, cy);
      }

      ctx.restore();
    }
  }, [tileset, tile, size, onTile, num]);

  return (
    <canvas style={{width:`${size}px`, height:`${size}px`}} ref={canvas} width={size} height={size}/>
  );
};

export default TileImage
