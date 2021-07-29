import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useUIState } from '../state/UIState';
import { TileSet } from '../2d/tileset';
import './HUD.css';
import wwTileImage from '../2d/tiles-ww.png';
import TileImage from '../components/TileImage';
import { CC } from '../logic/tile';

const ChipsNeeded = ({chipsNeeded}) => {
  return (
    <div id="chips-needed">
      <div className="hud-label">Chips Left</div>
      <div className="hud-value">{chipsNeeded}</div>
    </div>
  );
};

const TimeLeft = ({timeLeft}) => {
  return (
    <div id="time-left">
      <div className="hud-label">Time Left</div>
      <div className="hud-value">{timeLeft < 0 ? '-' : timeLeft}</div>
    </div>
  );
};

const FPS = ({fps}) => {
  return (
    <div id="fps">
      <div>FPS</div>
      <div>{fps}</div>
    </div>
  );
};

const HUD = observer(() => {
  const uiState = useUIState();

  useEffect(() => {
    const i = new Image();
    i.src = wwTileImage;
    i.onload = () => {
      // w/h=0.4375 would be Tile World image (with 7x16 tiles - no masks)
      // w/h=0.8125 would be CC image (with 13x16 tiles - including masks)
      tileset.current = new TileSet(i);
    };
  }, []);

  const tileset = useRef();

  return (
    <div>
      {!uiState.isPointerLocked && uiState.isGameStarted && !uiState.isGameOver &&
        <div id="pointer-unlocked">Click anywhere to look around - W/A/S/D to move</div>
      }

      <FPS fps={uiState.fps}/>
      <ChipsNeeded chipsNeeded={uiState.numChipsNeeded}/>
      <TimeLeft timeLeft={uiState.timeLeft}/>

      <div id="inventory">
        <TileImage tileset={tileset.current} tile={uiState.numBlueKeys ? CC.BLUE_KEY : CC.FLOOR} size={20} onTile={CC.FLOOR} num={uiState.numBlueKeys}/>
        <TileImage tileset={tileset.current} tile={uiState.numRedKeys ? CC.RED_KEY : CC.FLOOR} size={20} onTile={CC.FLOOR} num={uiState.numRedKeys}/>
        <TileImage tileset={tileset.current} tile={uiState.numYellowKeys ? CC.YELLOW_KEY : CC.FLOOR} size={20} onTile={CC.FLOOR} num={uiState.numYellowKeys}/>
        <TileImage tileset={tileset.current} tile={uiState.hasGreenKey ? CC.GREEN_KEY : CC.FLOOR} size={20} onTile={CC.FLOOR}/>
        <TileImage tileset={tileset.current} tile={uiState.hasFlippers ? CC.FLIPPERS : CC.FLOOR} size={20} onTile={CC.FLOOR}/>
        <TileImage tileset={tileset.current} tile={uiState.hasFireBoots ? CC.FIRE_BOOTS : CC.FLOOR} size={20} onTile={CC.FLOOR}/>
        <TileImage tileset={tileset.current} tile={uiState.hasIceSkates ? CC.ICE_SKATES : CC.FLOOR} size={20} onTile={CC.FLOOR}/>
        <TileImage tileset={tileset.current} tile={uiState.hasSuctionBoots ? CC.SUCTION_BOOTS : CC.FLOOR} size={20} onTile={CC.FLOOR}/>
      </div>
    </div>
  );
});

export default HUD;
