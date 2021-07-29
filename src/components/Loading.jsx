import React from 'react';
import './Loading.css';
import outline from '../assets/outline.png'

const Loading = ({percent}) => {
  return (
    <div id="loading-screen">
      <div id='progress-container'>
        <img id='progress-mask' src={outline} alt='progress-mask'/>
        <div style={{
          backgroundColor: 'lightblue',
          width: '168px',
          height: `${Math.round(percent * 216)}px`,
          position: 'absolute',
          left: '0px',
          bottom: '0px',
        }}/>
      </div>

      <div>{Math.round(percent * 100)}%</div>
    </div>
  )
};

export default Loading;
