# The Mobility Space Report: What the Street!?
**Part 1: Data Wrangling**

![screen shot 2017-06-27 at 19 11 42](https://user-images.githubusercontent.com/533590/27597962-b001f55c-5b6c-11e7-97e4-d3fef2033637.png)

[*What the Street!?*](http://whatthestreet.moovellab.com/) was derived out of the question “How do new and old mobility concepts change our cities?”. It was raised by [Michael Szell](http://lab.moovel.com/people/michael-szell) and [Stephan Bogner](http://lab.moovel.com/people/stephan-bogner) during their residency at [moovel lab](http://lab.moovel.com/). With support of the lab team they set out to wrangle data of cities around the world to develop and design this unique *Mobility Space Report*.

*What the Street!?* was made out of open-source software and resources. Thanks to the OpenStreetMap contributors and many other pieces we put together the puzzle of urban mobility space seen above.

Implemented project URL: [http://whatthestreet.moovellab.com/](http://whatthestreet.moovellab.com/)

Read more about the technical details behind *The Mobility Space Report: What the Street!?* on our blog: [http://lab.moovel.com/blog/about-what-the-street](http://lab.moovel.com/blog/about-what-the-street)

[Demo Video](https://www.youtube.com/watch?v=QxRr3CSfp8E)

## Codebase
The complete codebase consist of two independent parts:

1. Data Wrangling
2. Front & Backend

This is part 1. It wrangles the OpenStreetMap data and creates the SVG files underlying the visuals of *What the Street!?*.

You can find part 2 here: [https://github.com/moovel/lab-what-the-street](https://github.com/moovel/lab-what-the-street)

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Note about code quality](#note-about-code-quality)
- [Inital setup](#inital-setup)
- [Adding a city](#adding-a-city)
  - [Process OSM data](#process-osm-data)
    - [1. Create geo files](#1-create-geo-files)
    - [2. Load into mongoDB](#2-load-into-mongodb)
    - [3. Street names](#3-street-names)
    - [4. Generate streets](#4-generate-streets)
  - [Generate parking spots](#generate-parking-spots)
    - [1. Create SVGs](#1-create-svgs)
    - [2. Add neighborhood information to SVG/mongoDB](#2-add-neighborhood-information-to-svgmongodb)
    - [3. Add parking space size information to SVG](#3-add-parking-space-size-information-to-svg)
  - [Calculate area for streets/rails](#calculate-area-for-streetsrails)
    - [1. Calculate area](#1-calculate-area)
    - [2. Add area](#2-add-area)
  - [Set up landmark](#set-up-landmark)
    - [0. Finding a landmark](#0-finding-a-landmark)
    - [1. Tracing](#1-tracing)
    - [2. Area size information](#2-area-size-information)
    - [3. Convert to SVG](#3-convert-to-svg)
    - [4. Edit in Sketch](#4-edit-in-sketch)
  - [Generate street coils](#generate-street-coils)
  - [Update citymetadata.json](#update-citymetadatajson)
- [Team](#team)
- [Acknowledgements](#acknowledgements)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Note about code quality

The code in this repository was produced for the specific use case of wrangling data for *What the Street!?*. Since this is not live production code, but code to pre-process data, we did *not* strictly apply best practices of software development. The code grew organically together with various deadlines and requirements that came from front & backend develoment on the way. Nevertheless, we commented and documented as well as possible to make the process reproducible.

## Inital setup
- Get [NodeJS][13]
- Get [osmconvert.c][8]. Set `border__edge_M 1300004` so it can handle larger poly files. Compile: `gcc osmconvert.c -lz -O3 -o osmconvert`
- Get [osmfilter][9]
- Get [MongoDB][11]
- Get [QGIS][2], install the osmpoly_export plugin
- Get [Anaconda][1] (Python 3.*)
- Get [SVGnest-batch][12]
- Extra python libraries to install: pymongo, shapely, haversine, [osmnx][10] (first rtree!), pyprind
- Get mongosm from [Stephan Bogner's fork][3], and in options.js of mongosm/lib, set `populateGeometry: false`. To get dependencies, run: `npm install` 

## Adding a city
Follow this order. If not noted otherwise, run commands in terminal. Examples for Berlin.

### Process OSM data
#### 1. Create geo files
1. Get shapefile of city boundary from somewhere. If nowhere found, use [Turbopass][4], mind [the correct admin_level][7]:  
`[out:json];  
(
  node[boundary="administrative"][admin_level=6](48.46, 8.79, 48.93, 9.50);
  way[boundary="administrative"][admin_level=6](48.46, 8.79, 48.93, 9.50);
) ;(._;>;);  
out skel;`
- Load file into QGIS, save as a duplicate with correct `CRS: EPSG:4326`, and save as `berlin_boundary.poly` via `Vector > Export OSM Poly`
- Download and unpack osm.bz2 file that contains the city from [geofabrik][6], e.g berlin-latest
- Crop osm file according the boundary using osmconvert `./osmconvert berlin-latest.osm -B=berlin_boundary.poly --drop-broken-refs -o=berlin_cropped.osm`

#### 2. Load into mongoDB
1. Load osm data into mongoDB via mongosm `node mongosm.js --max_old_space_size=8192 -db berlin_raw -f berlin_cropped.osm` (don't forget to run `npm install` before running the script the first time to install dependencies)
2. Set cityname parameter (in Jupyter notebook) and execute `01_generategeometries.ipynb`

#### 3. Street names
**Note:** osmfilter seems buggy and does not actually remove some things we want removed. That's why we need to manually remove them in the end.  

1. Use osmfilter to create a temporary osm file containing only the relevant streets (to derive names from) `./osmfilter berlin_cropped.osm --keep="highway=residential =primary =secondary =tertiary =unclassified" --drop="public_transport=stop_position public_transport=platform public_transport man_made boundary leisure amenity highway=traffic_signals =motorway_junction =bus_stop railway building entrance=yes barrier=gate barrier shop" > temp.osm`
- Extract names and export as csv `./osmconvert temp.osm --all-to-nodes --csv="name" > temp.csv`
- Sort alphabetically and discard duplicates `sort -u temp.csv > citydata/berlin_streetnames.txt`
- Check manually and delete obvious errors. 
- Sort by length of string `cat citydata/berlin_streetnames.txt | awk '{ print length, $0 }' | sort -n -s | cut -d" " -f2- > citydata/berlin_streetnames_bylength.txt`
- Check again manually for obvious errors.

#### 4. Generate streets
1. Set cityname parameter (in Jupyter notebook) and execute `02_unwindbike.ipynb`
- Set cityname parameter (in Jupyter notebook) and execute `03_unwindrail.ipynb`
- Set cityname parameter (in Jupyter notebook) and execute `04_unwindstreet.ipynb`

### Generate parking spots

#### 1. Create SVGs
1. Serve SVGnest-batch locally (e.g. `python3 -m http.server` or `python -m SimpleHTTPServer 8000`)
- Set cityname parameter and execute `05_parkingtosvgbike.ipynb` **step by step**. 
	- This involves executing SVGnest-batch inbetween!
	- **If SVGNest fails** → execute `06_parkingtosvgbikealt.ipynb` instead! 
	- In the end an SVG (all.svg) like the following is created:  
![SVG of bike parking spots](_assets/bikeparkingexample.png "SVG of car parking spots")

- Set cityname parameter and execute `07_parkingtosvgcar.ipynb` **step by step**. 
	- This involves executing SVGnest-batch inbetween!
	- In the end an SVG (all.svg) like following is created (shown rotated):  
![SVG of car parking spots](_assets/carparkingexample.png "SVG of car parking spots")

#### 2. Add neighborhood information to SVG/mongoDB
Open `08_add_neighborhoods` and run `node index.js` to get instructions

#### 3. Add parking space size information to SVG
Open `09_add_parking_space_size` and run `node index.js` to get instructions

### Calculate area for streets/rails
This adds size information to the mongoDB

#### 1. Calculate area
Open `10_calculate_area` and run `node index.js` to get instructions

#### 2. Add area
Open `11_add_area` and run `node index.js` to get instructions

### Set up landmark
#### 0. Finding a landmark
Search for a proper landmark in the city (around the size of Central Park in NY or Mt. Tabor in Portland)

#### 1. Tracing
The outlines can be traced via [geojson.io](http://geojson.io/), but any tool should be fine which produces a geojson-file. Make sure you trace as a polygon to calculate its size.

#### 2. Area size information
1. Import geojson to geojson.io
2. Click on shape
3. Select info
4. Extract m² information and update citymetadata.json

#### 3. Convert to SVG
1. Run `15_landmarkReference` in order to obtain a reference square (you only have to do this step once)
2. Merge the geojson of the landmark together with the reference
3. Install the plugin [SimpleSVG](https://plugins.qgis.org/plugins/simplesvg/) for QGIS
4. Open the geojson and from 'Tab', select save as svg
5. Save both, svg and geojson to GDrive

#### 4. Edit in Sketch
1. Import svgs
2. Scale that the reference square equals the width in pixels of the other landmarks reference squares
3. Style like other Landmarks
4. Simplify shape if necessary
5. Flatten text
6. Export

### Generate street coils
Open `12_generate_coils` and run `node index.js` to get instructions
**Note:** Running this script will result in large file sizes

### Update citymetadata.json
1. Use `13_get_information`
2. Use `16_getSvgHeights`

## Team
#### Concept and Coding
- [Michael Szell](http://lab.moovel.com/people/michael-szell)
- [Stephan Bogner](http://lab.moovel.com/people/stephan-bogner)

#### Direction
[Benedikt Groß](http://lab.moovel.com/people/benedikt-gross)

#### Website Front & Backend Engineering
[Thibault Durand](http://thibault-durand.fr/)

#### Website Implementation Assistant
Tobias Lauer

#### Visual Design
[Anagrama](https://www.anagrama.ro/)

#### Extended Team

- [Raphael Reimann](http://lab.moovel.com/people/raphael-reimann)
- [Joey Lee](http://lab.moovel.com/people/joey-lee)
- [Daniel Schmid](http://lab.moovel.com/people/daniel-schmid)
- [Tilman Häuser](http://lab.moovel.com/people/tilman-haeuser)

#### City Data Wrangling Assistant
[Johannes Wachs](http://johanneswachs.com/)

#### Data Sources
OpenStreetMap, a free alternative to services like Google Maps. Please contribute, if you notice poor data quality.

[https://donate.openstreetmap.org/](https://donate.openstreetmap.org/)

## Acknowledgements
- Parking space packing using [SVGnest](http://svgnest.com/) by [Jack Qiao](https://github.com/Jack000)
- Street chopping using [osmnx](https://github.com/gboeing/osmnx) by [Geoff Boeing](https://github.com/gboeing)


[1]: https://www.continuum.io/downloads
[2]: http://www.qgis.org/
[3]: https://github.com/stephanbogner/node-mongosm
[4]: http://overpass-turbo.eu/
[5]: https://github.com/stephanbogner/SVGNest
[6]: http://download.geofabrik.de/
[7]: http://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative#10_admin_level_values_for_specific_countries
[8]: https://github.com/mapsme/osmctools/blob/master/osmconvert.c
[9]: http://wiki.openstreetmap.org/wiki/Osmfilter#Download
[10]: https://github.com/gboeing/osmnx
[11]: https://www.mongodb.com/
[12]: https://github.com/stephanbogner/SVGnest-batch
[13]: https://nodejs.org/
