import React, { useRef, useEffect } from 'react';
import HUD from './HUD';

const Game = ({setCanvasRef}) => {
  const canvasRef = useRef();

  useEffect(() => setCanvasRef(canvasRef), [setCanvasRef, canvasRef]);
  
  return (
    <div>
      <canvas ref={canvasRef}/>
      <HUD/>
    </div>
  );
};

export default Game;
