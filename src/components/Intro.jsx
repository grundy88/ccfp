import React from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import Loading from './Loading';
import { useUIState } from '../state/UIState';
import splashImage from '../assets/splash.jpg';
import wall from '../assets/wall.png'
import floor from '../assets/floor.png'

const IntroContainer = styled.div`
  background-color: lightyellow;
  background-image: url(${splashImage});
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  position: absolute;
  top: 0px;
  right: 0px;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const IntroPane = styled.div`
  position: relative;
  height: 320px;
  width: 510px;
  background-color: yellow;
  border: solid 32px white;
  border-image: url(${wall}) 32 repeat;
  background-image: url(${floor});
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
`;

const IntroOption = styled.div`
  margin: 20px;
`;

const Banner = styled.div`
  font-size: 3em;
  font-weight: bold;
  color: teal;
`;

const Label = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  color: black;
`;

const List = styled.ul`
  background-color: beige;
  border: inset 3px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 0px;
  list-style: none inside;
  overflow: auto;
  cursor: default;
`;

const ListItem = styled.li`
  padding: 5px 10px;

  &:nth-child(even) {
    background: rgb(219, 219, 185);
  }
  &:hover {
    background-color: yellow;
    border: solid 1px black;
    padding: 4px 9px;
  }
`;

const Intro = observer(({levelSelected}) => {
  const uiState = useUIState();

  function load(e) {
    levelSelected(e.target.id);
  }

  return (
    <IntroContainer>
      <IntroPane>
        {!uiState.loadProgress &&
          <div>
            <Banner>CC 1st Person</Banner>

            <IntroOption>
              <Label>Jump into one of these levels:</Label>
              <List>
                <ListItem id='1' onClick={load}>LESSON 1</ListItem>
                <ListItem id='2' onClick={load}>LESSON 2</ListItem>
              </List>
            </IntroOption>
          </div>
        }

        {uiState.loadProgress &&
          <Loading percent={uiState.loadProgress.percent}/>
        }
      </IntroPane>
    </IntroContainer>
  );
});

export default Intro;
