/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useUIState } from './state/UIState';
import Intro from './components/Intro';
import Game from './components/Game';
import { GameController } from './scene/gamecontroller';
import { createScene } from "./scene/scene";
import { createTestScene } from "./scene/scenetest";
import { loadBinaryAsset, gameOverMessageForReason, EndReasons } from './util/utils'
import { loadLevelFromLevelset } from './levelset/CCLevelsetReader'
import { Level } from './logic/level';

const ModalOverlay = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const GameIntro = styled.div`
  border: 2px solid purple;
  background-color: white;
  width: 250px;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
`;

const GameInstructions = styled.div`
  text-align: left;
`;

const App = observer(() => {
  const uiState = useUIState();

  const [gameOverMessage, setGameOverMessage] = useState();

  const sceneRef = useRef();
  const gameCanvasRef = useRef();
  const gameControllerRef = useRef();
  
  useEffect(() => {
    if (uiState.test) loadLevel(1);

    return () => {
      if (sceneRef.current) sceneRef.current.dispose();
      sceneRef.current = null;
      setGameOverMessage(null);
    };
  }, []);

  useEffect(() => {
    setGameOverMessage(gameOverMessageForReason(uiState.gameOverReason));
  }, [uiState.gameOverReason]);

  function loadTest() {
    const level = new Level(1);
    level.title = 'Test';
    uiState.setLevel(level);
    createTestScene(gameCanvasRef.current, uiState).then(scene => {
      sceneRef.current = scene;
      uiState.gameReady();
      uiState.gameStarted();
    });
  }

  /**
   * 1) read .DAT file
   * 2) create BabylonJS Scene object using game canvas
   * 3) load all known 3d objects (meshes)
   * 4) clone meshes as needed to populate the level map
   * 5) start the game logic
   */
  function loadLevel(levelNumber) {
    uiState.startLoading();
    if (uiState.test) {
      loadTest();
      return;
    }

    loadBinaryAsset('CHIPS.dat').then(bytes => {
    // loadBinaryAsset('CCLP3.dat').then(bytes => {
    // loadBinaryAsset('CCLP4.dat').then(bytes => {
    // loadBinaryAsset('test.dat').then(bytes => {
      const level = loadLevelFromLevelset(bytes, levelNumber);
      uiState.setLevel(level);

      if (!gameControllerRef.current) {
        const [scene, shadowGenerator, camera] = createScene(gameCanvasRef.current, uiState);
        sceneRef.current = scene;
        gameControllerRef.current = new GameController(scene, shadowGenerator, camera, uiState);
      }

      gameControllerRef.current.loadMeshes().then(() => {
        gameControllerRef.current.setupLevel(level).then(() => {
          uiState.gameReady();
        });
      });
    });
  }

  function setCanvasRef(ref) {
    gameCanvasRef.current = ref.current;
  }

  return (
    <div id="App">
      <Game setCanvasRef={setCanvasRef} style={{visibility: uiState.isGameReady ? 'visible' : 'hidden'}}/>

      {!uiState.isGameReady && <Intro levelSelected={loadLevel}/>}

      {uiState.isGameReady && !uiState.isGameStarted &&
        <ModalOverlay>
          <GameIntro>
            <div>{uiState.level.title}</div>
            <GameInstructions>
              <ul>
                <li>W/A/S/D - move</li>
                <li>Q/E - turn</li>
                <li>click anywhere to look around with the mouse</li>
              </ul>
            </GameInstructions>
            <div>press any key to start</div>
          </GameIntro>
        </ModalOverlay>
      }

      {gameOverMessage &&
        <ModalOverlay>
          <GameIntro>
            <div>{gameOverMessage}</div>
            {uiState.gameOverReason === EndReasons.Exit &&
              <div>press any key</div>
            }
            {uiState.gameOverReason !== EndReasons.Exit &&
              <div>press any key to restart</div>
            }
            </GameIntro>
        </ModalOverlay>
      }
    </div>
  );

});

export default App;
