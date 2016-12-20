# Generate Image Sequences

**[IMPORTANT: Still Work In Progress]**

## About
Animates all streets and saves each frame as screenshot

## Setup
1. Download and install Firefox (the renderer)
2. Install SlimerJS by running `brew install slimerjs`
3. Download project and navigate to folder (using Terminal), then run `npm install`

## How to run
1. Navigate to folder (in Terminal)
2. Serve folder locally (`python3 -m http.server`)
3. Run Casper (`casperjs --engine=slimerjs index.js`)
4. Exported screenshots will appear in folder `export`