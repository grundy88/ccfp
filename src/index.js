import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import UIState, { UIStateProvider } from './state/UIState';

const uiState = new UIState();

ReactDOM.render(
  <React.StrictMode>
    <UIStateProvider store={uiState}>
      <App />
    </UIStateProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
