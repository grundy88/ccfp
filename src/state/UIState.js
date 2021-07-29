import React from 'react';
import { makeAutoObservable } from 'mobx';

class LoadProgress {
  percent = 0;
  message = null;

  setPercent = async (p) => {
    this.percent = p;
    // hackalicious - let react loop update per progress callback
    await new Promise((resolve) => setTimeout(resolve, 1));
  };

  setMessage = (m) => this.message = m;

  constructor() {
    makeAutoObservable(this);
  }
}

export default class UIState {
  test = false;
  // test = true;

  level = null;

  loadProgress = null;
  isGameReady = false;
  isGameStarted = false;
  isGameOver = false;
  gameOverReason = null;

  numChipsNeeded = 0;
  timeLeft = 0;
  numBlueKeys = 0;
  numRedKeys = 0;
  numYellowKeys = 0;
  hasGreenKey = false;
  hasFlippers = false;
  hasFireBoots = false;
  hasIceSkates = false;
  hasSuctionBoots = false;

  fps = 0;
  isPointerLocked = false;

  // --------------------------------------------------------------------------

  constructor() {
    makeAutoObservable(this);
  }

  setLevel = (l) => { this.level = l; };

  startLoading() {
    this.isGameReady = false;
    this.isGameStarted = false;
    this.isGameOver = false;
    this.gameOverReason = 0;
    this.loadProgress = new LoadProgress();
    return this.loadProgress;
  }
  gameReady() {
    this.isGameReady = true;
    this.loadProgress = null;
  }
  gameStarted = () => this.isGameStarted = true;
  setGameOver = (r) => {
    this.isGameOver = true;
    this.gameOverReason = r;
  };
  reset = () => {
    this.isGameReady = false;
    this.isGameStarted = false;
    this.isGameOver = false;
    this.gameOverReason = 0;
  };

  setNumChipsNeeded = (v) => this.numChipsNeeded = v;
  setTimeLeft = (v) => this.timeLeft = v;
  setNumBlueKeys = (v) => this.numBlueKeys = v;
  setNumRedKeys = (v) => this.numRedKeys = v;
  setNumYellowKeys = (v) => this.numYellowKeys = v;
  setHasGreenKey = (v) => this.hasGreenKey = v;
  setHasFlippers = (v) => this.hasFlippers = v;
  setHasFireBoots = (v) => this.hasFireBoots = v;
  setHasIceSkates = (v) => this.hasIceSkates = v;
  setHasSuctionBoots = (v) => this.hasSuctionBoots = v;

  setFps = (v) => this.fps = v;
  setPointerLocked = (v) => this.isPointerLocked = v;
}

// ----------------------------------------------------------
// todo is this the best way to provide access to mobx state?

export const UIStateContext = React.createContext();

export const UIStateProvider = ({ children, store }) => (
  <UIStateContext.Provider value={store}>{children}</UIStateContext.Provider>
);

export const useUIState = () => React.useContext(UIStateContext);
