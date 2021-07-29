I wondered what it would be like to explore Chip's Challenge levels from the
perspective of Chip himself, so I started on this project. 

Currently this is in the proof-of-concept phase. Only two levels are supported.

Also worth keeping in mind: 2D level design often doesn't translate well to 3D,
this whole thing is just for fun.

<https://ccfp.netlify.app/>

# Tech

This is a [React](https://reactjs.org/) app, using [BabylonJS](https://www.babylonjs.com/)
for the 3D rendering. What 3D modeling there is has so far been done mostly
with [Blender](https://www.blender.org/).

In a nutshell, React sets up the web app, and the bulk of the javascript/typescript 
is for reading a map from a level file, sending that to a CC game engine, and using
that engine to decide what to draw with BabylonJS.

# Code Tour

* [App.jsx](src/App.jsx): entry point - sets up [Game.jsx](src/components/Game.jsx) and [Intro.jsx](src/components/Intro.jsx)
* [Game.jsx](src/components/Game.jsx) contains the HTML Canvas used for WebGL drawing (via BabylonJS)
* selecting a level causes the following to happen (in [App.jsx](src/App.jsx)):
    1. read a `.DAT` file containing level data (with [CCLevelsetReader.ts](src/levelset/CCLevelsetReader.ts))
    2. create a BabylonJS Scene object using the HTML canvas (in [scene.js](src/scene/scene.js))
    3. load all supported 3d objects (aka meshes) (in [mesh.ts](src/scene/mesh.ts))
    4. clone those meshes as needed to populate the level map in 3D (in [gamecontroller.ts](src/scene/gamecontroller.ts))
    5. start the game loop (in [gameloop.ts](src/scene/gameloop.ts) - called every time the screen is rendered)
* the game loop makes use of a game engine adapted from Tile World C code (in [lynx.ts](src/logic/lynx.ts) and the rest of the code in [src/logic](src/logic))

# TODO

## Alpha

* all tiles
    * animated monsters (legs, etc)
    * animated tiles (ie. force floors)
    * investigate materials/textures all in the blender file
    * attempt more reusable code for mesh loading (perhaps each mesh
      can simply be loaded from its own file, and move away from
      per-mesh programmatic setup)
* explosion animations
* smooth and consistent movement
* HUD
    * hint
    * 2D map
* menu
    * levelset select (built in, from local file, from https://bitbusters.club/gliderbot/sets/cc1/)
    * level select
* pause/play
* convert everything to typescript
* sounds
* if trying to move in a dir but can't and camera is at a slight angle,
  try the orthogonal dir (if camera angle is more than some threshold?)

## Beta

* TWS playback
