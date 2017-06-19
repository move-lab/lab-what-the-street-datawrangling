# Generate Coils
## About

## Setup
1. Navigate to folder (with Terminal)
2. Run `npm install`
3. copy `lib` folder from root and into this directory
3. Done


## Usage
Run `node index.js` and you will get an explanation

## Commands to Run
### amsterdam
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/amsterdam_derived --parkingSvgHeight 3715 --parkingArea 1554865.52 --meterPerPixel 1.018721 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/amsterdam_derived --parkingSvgHeight 3715 --parkingArea 1554865.52 --meterPerPixel 1.018721 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/amsterdam_derived --parkingSvgHeight 3715 --parkingArea 1554865.52 --meterPerPixel 1.018721 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/amsterdam_derived --parkingSvgHeight 3715 --parkingArea 1554865.52 --meterPerPixel 1.018721 --collection streets
```

### barcelona
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/barcelona_derived --parkingSvgHeight 1371 --parkingArea 848626.92 --meterPerPixel 1.253088 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/barcelona_derived --parkingSvgHeight 1371 --parkingArea 848626.92 --meterPerPixel 1.253088 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/barcelona_derived --parkingSvgHeight 1371 --parkingArea 848626.92 --meterPerPixel 1.253088 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/barcelona_derived --parkingSvgHeight 1371 --parkingArea 848626.92 --meterPerPixel 1.253088 --collection streets
```

### beijing
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/beijing_derived --parkingSvgHeight 3207 --parkingArea 2177509.53 --meterPerPixel 1.281324 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/beijing_derived --parkingSvgHeight 3207 --parkingArea 2177509.53 --meterPerPixel 1.281324 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/beijing_derived --parkingSvgHeight 3207 --parkingArea 2177509.53 --meterPerPixel 1.281324 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/beijing_derived --parkingSvgHeight 3207 --parkingArea 2177509.53 --meterPerPixel 1.281324 --collection streets
```

### berlin
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived --parkingSvgHeight 20584 --parkingArea 8156098.06 --meterPerPixel 1.009516 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived --parkingSvgHeight 20584 --parkingArea 8156098.06 --meterPerPixel 1.009516 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived --parkingSvgHeight 20584 --parkingArea 8156098.06 --meterPerPixel 1.009516 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived --parkingSvgHeight 20584 --parkingArea 8156098.06 --meterPerPixel 1.009516 --collection streets
```

### boston
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/boston_derived --parkingSvgHeight 1695 --parkingArea 1016707.35 --meterPerPixel 1.231581 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/boston_derived --parkingSvgHeight 1695 --parkingArea 1016707.35 --meterPerPixel 1.231581 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/boston_derived --parkingSvgHeight 1695 --parkingArea 1016707.35 --meterPerPixel 1.231581 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/boston_derived --parkingSvgHeight 1695 --parkingArea 1016707.35 --meterPerPixel 1.231581 --collection streets
```

### budapest
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/budapest_derived --parkingSvgHeight 6693 --parkingArea 3289634.03 --meterPerPixel 1.128625 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/budapest_derived --parkingSvgHeight 6693 --parkingArea 3289634.03 --meterPerPixel 1.128625 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/budapest_derived --parkingSvgHeight 6693 --parkingArea 3289634.03 --meterPerPixel 1.128625 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/budapest_derived --parkingSvgHeight 6693 --parkingArea 3289634.03 --meterPerPixel 1.128625 --collection streets
```

### chicago
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/chicago_derived --parkingSvgHeight 23527 --parkingArea 14619593.73 --meterPerPixel 1.244775 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/chicago_derived --parkingSvgHeight 23527 --parkingArea 14619593.73 --meterPerPixel 1.244775 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/chicago_derived --parkingSvgHeight 23527 --parkingArea 14619593.73 --meterPerPixel 1.244775 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/chicago_derived --parkingSvgHeight 23527 --parkingArea 14619593.73 --meterPerPixel 1.244775 --collection streets
```

### copenhagen
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/copenhagen_derived --parkingSvgHeight 3959 --parkingArea 1300246.11 --meterPerPixel 0.94054 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/copenhagen_derived --parkingSvgHeight 3959 --parkingArea 1300246.11 --meterPerPixel 0.94054 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/copenhagen_derived --parkingSvgHeight 3959 --parkingArea 1300246.11 --meterPerPixel 0.94054 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/copenhagen_derived --parkingSvgHeight 3959 --parkingArea 1300246.11 --meterPerPixel 0.94054 --collection streets
```

### helsinki
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/helsinki_derived --parkingSvgHeight 9326 --parkingArea 2427001.99 --meterPerPixel 0.827405 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/helsinki_derived --parkingSvgHeight 9326 --parkingArea 2427001.99 --meterPerPixel 0.827405 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/helsinki_derived --parkingSvgHeight 9326 --parkingArea 2427001.99 --meterPerPixel 0.827405 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/helsinki_derived --parkingSvgHeight 9326 --parkingArea 2427001.99 --meterPerPixel 0.827405 --collection streets
```

### hongkong
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/hongkong_derived --parkingSvgHeight 1992 --parkingArea 1793753.56 --meterPerPixel 1.406332 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/hongkong_derived --parkingSvgHeight 1992 --parkingArea 1793753.56 --meterPerPixel 1.406332 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/hongkong_derived --parkingSvgHeight 1992 --parkingArea 1793753.56 --meterPerPixel 1.406332 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/hongkong_derived --parkingSvgHeight 1992 --parkingArea 1793753.56 --meterPerPixel 1.406332 --collection streets
```

### jakarta
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/jakarta_derived --parkingSvgHeight 4487 --parkingArea 1366919.62 --meterPerPixel 1.662007 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/jakarta_derived --parkingSvgHeight 4487 --parkingArea 1366919.62 --meterPerPixel 1.662007 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/jakarta_derived --parkingSvgHeight 4487 --parkingArea 1366919.62 --meterPerPixel 1.662007 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/jakarta_derived --parkingSvgHeight 4487 --parkingArea 1366919.62 --meterPerPixel 1.662007 --collection streets
```

### johannesburg
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/johannesburg_derived --parkingSvgHeight 4487 --parkingArea 3749097.91 --meterPerPixel 1.496148 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/johannesburg_derived --parkingSvgHeight 4487 --parkingArea 3749097.91 --meterPerPixel 1.496148 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/johannesburg_derived --parkingSvgHeight 4487 --parkingArea 3749097.91 --meterPerPixel 1.496148 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/johannesburg_derived --parkingSvgHeight 4487 --parkingArea 3749097.91 --meterPerPixel 1.496148 --collection streets
```

### london
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/london_derived --parkingSvgHeight 25822 --parkingArea 11001870.06 --meterPerPixel 1.0405 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/london_derived --parkingSvgHeight 25822 --parkingArea 11001870.06 --meterPerPixel 1.0405 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/london_derived --parkingSvgHeight 25822 --parkingArea 11001870.06 --meterPerPixel 1.0405 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/london_derived --parkingSvgHeight 25822 --parkingArea 11001870.06 --meterPerPixel 1.0405 --collection streets
```

### losangeles
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/losangeles_derived --parkingSvgHeight 14180 --parkingArea 10718240.39 --meterPerPixel 1.382914 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/losangeles_derived --parkingSvgHeight 14180 --parkingArea 10718240.39 --meterPerPixel 1.382914 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/losangeles_derived --parkingSvgHeight 14180 --parkingArea 10718240.39 --meterPerPixel 1.382914 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/losangeles_derived --parkingSvgHeight 14180 --parkingArea 10718240.39 --meterPerPixel 1.382914 --collection streets
```

### moscow
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/moscow_derived --parkingSvgHeight 26866 --parkingArea 9554779.18 --meterPerPixel 0.940176 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/moscow_derived --parkingSvgHeight 26866 --parkingArea 9554779.18 --meterPerPixel 0.940176 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/moscow_derived --parkingSvgHeight 26866 --parkingArea 9554779.18 --meterPerPixel 0.940176 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/moscow_derived --parkingSvgHeight 26866 --parkingArea 9554779.18 --meterPerPixel 0.940176 --collection streets
```

### newyork
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/newyork_derived --parkingSvgHeight 9758 --parkingArea 6438190.23 --meterPerPixel 1.266896 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/newyork_derived --parkingSvgHeight 9758 --parkingArea 6438190.23 --meterPerPixel 1.266896 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/newyork_derived --parkingSvgHeight 9758 --parkingArea 6438190.23 --meterPerPixel 1.266896 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/newyork_derived --parkingSvgHeight 9758 --parkingArea 6438190.23 --meterPerPixel 1.266896 --collection streets
```

### portland
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/portland_derived --parkingSvgHeight 6016 --parkingArea 3256151.8 --meterPerPixel 1.167033 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/portland_derived --parkingSvgHeight 6016 --parkingArea 3256151.8 --meterPerPixel 1.167033 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/portland_derived --parkingSvgHeight 6016 --parkingArea 3256151.8 --meterPerPixel 1.167033 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/portland_derived --parkingSvgHeight 6016 --parkingArea 3256151.8 --meterPerPixel 1.167033 --collection streets
```

### rome
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/rome_derived --parkingSvgHeight 8655 --parkingArea 5068537.63 --meterPerPixel 1.242748 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/rome_derived --parkingSvgHeight 8655 --parkingArea 5068537.63 --meterPerPixel 1.242748 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/rome_derived --parkingSvgHeight 8655 --parkingArea 5068537.63 --meterPerPixel 1.242748 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/rome_derived --parkingSvgHeight 8655 --parkingArea 5068537.63 --meterPerPixel 1.242748 --collection streets
```

### sanfrancisco
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/sanfrancisco_derived --parkingSvgHeight 2546 --parkingArea 1644303.24 --meterPerPixel 1.356582 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/sanfrancisco_derived --parkingSvgHeight 2546 --parkingArea 1644303.24 --meterPerPixel 1.356582 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/sanfrancisco_derived --parkingSvgHeight 2546 --parkingArea 1644303.24 --meterPerPixel 1.356582 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/sanfrancisco_derived --parkingSvgHeight 2546 --parkingArea 1644303.24 --meterPerPixel 1.356582 --collection streets
```

### singapore
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/singapore_derived --parkingSvgHeight 4174 --parkingArea 4227709.77 --meterPerPixel 1.671871 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/singapore_derived --parkingSvgHeight 4174 --parkingArea 4227709.77 --meterPerPixel 1.671871 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/singapore_derived --parkingSvgHeight 4174 --parkingArea 4227709.77 --meterPerPixel 1.671871 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/singapore_derived --parkingSvgHeight 4174 --parkingArea 4227709.77 --meterPerPixel 1.671871 --collection streets
```

### stuttgart
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/stuttgart_derived --parkingSvgHeight 3600 --parkingArea 2071356.74 --meterPerPixel 1.098574 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/stuttgart_derived --parkingSvgHeight 3600 --parkingArea 2071356.74 --meterPerPixel 1.098574 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/stuttgart_derived --parkingSvgHeight 3600 --parkingArea 2071356.74 --meterPerPixel 1.098574 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/stuttgart_derived --parkingSvgHeight 3600 --parkingArea 2071356.74 --meterPerPixel 1.098574 --collection streets
```

### tokyo
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/tokyo_derived --parkingSvgHeight 9200 --parkingArea 5951035.54 --meterPerPixel 1.356659 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/tokyo_derived --parkingSvgHeight 9200 --parkingArea 5951035.54 --meterPerPixel 1.356659 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/tokyo_derived --parkingSvgHeight 9200 --parkingArea 5951035.54 --meterPerPixel 1.356659 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/tokyo_derived --parkingSvgHeight 9200 --parkingArea 5951035.54 --meterPerPixel 1.356659 --collection streets
```

### vienna
```
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/vienna_derived --parkingSvgHeight 6987 --parkingArea 3246050.9 --meterPerPixel 1.11174 --collection biketracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/vienna_derived --parkingSvgHeight 6987 --parkingArea 3246050.9 --meterPerPixel 1.11174 --collection railtracks
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/vienna_derived --parkingSvgHeight 6987 --parkingArea 3246050.9 --meterPerPixel 1.11174 --collection railtracksparking
node --max_old_space_size=8192 index.js --mongodb mongodb://127.0.0.1:27017/vienna_derived --parkingSvgHeight 6987 --parkingArea 3246050.9 --meterPerPixel 1.11174 --collection streets
```

## Density of Parking Spaces
```
berlin               396 m2/pixelrow    1.01 m/px
newyork              660 m2/pixelrow    1.27 m/px
amsterdam            419 m2/pixelrow    1.02 m/px
stuttgart            575 m2/pixelrow    1.1 m/px
portland             541 m2/pixelrow    1.17 m/px
losangeles           756 m2/pixelrow    1.38 m/px
sanfrancisco         646 m2/pixelrow    1.36 m/px
boston               600 m2/pixelrow    1.23 m/px
vienna               465 m2/pixelrow    1.11 m/px
copenhagen           328 m2/pixelrow    0.94 m/px
barcelona            619 m2/pixelrow    1.25 m/px
beijing              679 m2/pixelrow    1.28 m/px
budapest             492 m2/pixelrow    1.13 m/px
chicago              621 m2/pixelrow    1.24 m/px
helsinki             260 m2/pixelrow    0.83 m/px
hongkong             900 m2/pixelrow    1.41 m/px
jakarta              305 m2/pixelrow    1.66 m/px
johannesburg         836 m2/pixelrow    1.5 m/px
london               426 m2/pixelrow    1.04 m/px
moscow               356 m2/pixelrow    0.94 m/px
rome                 586 m2/pixelrow    1.24 m/px
singapore            1013 m2/pixelrow    1.67 m/px
tokyo                647 m2/pixelrow    1.36 m/px
```

## Settings
```
Example:
     node --max_old_space_size=8192 index.js --parkingSvgHeight 20584 --parkingArea 8156098.06 --mongodb mongodb://127.0.0.1:27017/berlin_derived --collection streets

   Note:
     - You might have to adjust the size of the strokeWidth. Best is to make a first try using --limit (something like 300) and look at the svg.
       It should be clearly a coil with little gaps between each slope (if it is not like that sometimes, that is ok), but if most overlap, adjust the stroke width size.
     - if the coil is too messy or too clean, you can also play with the damping value (see below)
     - Define parkingSpots only when using coiling streets for cars
     - Run with more RAM allocation (--max_old_space_size=8192) as in the example

   Settings per city:
     --meterPerPixel: Defines the scale - defaults to 1.2672955975
     --parkingSvgHeight: The height of the packed parking spaces
     --parkingArea: ... and their area (see citymetadata)
       Those two parameters define the scale of m per px, so one setting works for all types of mobility
     --mongodb: The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin
       (it will expect a db ending with _derived as input and will out the same name but ending with _coiled)

   Settings per form of mobility:
     --collection: The name of the collection you want to get information from and also save to
     --damping: [Optional] The amount of damping (around 100 [little damped] - 200 [damped a lot]).
       You might have to tweak this for the different mobility types - defaults depending on collection ({"streets":1000,"railtracks":1000,"railtracksparking":700,"biketracks":1000})
     --gap: [optional] Gap between the individual streets/rails in % (as fraction) relative to the coil width - default: 0
     --strokeWidth: [optional] Defines the stroke width of the generated coils - defaults depending on collection ({"streets":11,"railtracks":5,"railtracksparking":5,"biketracks":5})

   Extra Settings when coiling streets for cars:
     --parkingSpots: [optional] Number of on street parking spots (take from citymetadata.json) - defaults to 0

   Debug Options:
     --limit: [Debug] Limit how many streets/rails should get coiled

   More options (which by default you will not have to use):
     --strokeColor: [optional] The color of the coiled streets/rails - defaults to #6566CC
     --alternatingStrokeColor: [optional] if you want to alternating colors for streets - defaults to false
     --mongodbIn: [optional] The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (defaults to --mongodb)
     --mongodbOut: [optional] ... export mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (defaults to --mongodb and changes the suffix)
     --adaptSize: [optional] scales all areas with the defined factor - defaults to 1
     --collectionIn: [optional] The name of the collection you want to get information from defaults to --collection
     --collectionOut: [optional] The name of the collection you want to output to - defaults to the same name as --collection --collectionIn
     --widthInMeter: [optional] Width of the street coil in meters (scale) - default: 745.16981133
     --widthInPixels: [optional] Width of the street coil in pixels (scale) - default: 588
```