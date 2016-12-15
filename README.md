# {{{lab-mobviz}}}
## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
- [About](#about)
- [Inital setup](#inital-setup)
- [Adding a city](#adding-a-city)
  - [Process OSM data](#process-osm-data)
    - [1. Create geo files](#1-create-geo-files)
    - [2. Load into MongoDB](#2-load-into-mongodb)
    - [3. Street names](#3-street-names)
    - [4. Generate streets](#4-generate-streets)
  - [Generate Parking Spots](#generate-parking-spots)
    - [1. Create svgs](#1-create-svgs)
    - [2. Add neighborhood information to svg](#2-add-neighborhood-information-to-svg)
  - [Generate Street Coils](#generate-street-coils)
- [Team](#team)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## About
This repository shows how to preparate data and create the visuals which were used in the project {{{lab-mobviz}}} by [moovel lab](http://lab.moovel.com/).

## Inital setup
- Get [osmconvert.c][8]. Set `border__edge_M 1300004` so it can handle larger poly files. Compile: `gcc osmconvert.c -lz -O3 -o osmconvert`
- Get [osmfilter][9]
- Get [MongoDB][11]
- Get [QGIS][2], install the osmpoly_export plugin
- Get [Anaconda][1] (Python 3.*)
- Get [SVGnest-batch][12]
- Extra python libraries to install: pymongo, shapely, haversine, [osmnx][10] (first rtree!), pyprind
- Get mongosm from [Stephan Bogner's fork][3], and in options.js of mongosm/lib, set `populateGeometry: false`. To get dependencies, run: `npm install` 

## Adding a city
**Folder:** datapreparation. Follow this order. If not noted otherwise, run commands in terminal. Examples for Berlin.

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

#### 2. Load into MongoDB
1. Load osm data into MongoDB via mongosm `node mongosm.js --max_old_space_size=8192 -db berlin_raw -f berlin_cropped.osm`
2. Set cityname parameter (in Jupyter notebook) and execute `01_generategeometries.ipynb`

#### 3. Street names
**Note:** osmfilter seems buggy and does not actually remove some things we want removed. That's why we need to manually remove them in the end.  

1. Use osmfilter to create a temporary osm file containing only the relevant streets (to derive names from) `./osmfilter berlin_cropped.osm --keep="highway=residential =primary =secondary =tertiary =unclassified" --drop="public_transport=stop_position public_transport=platform public_transport man_made boundary leisure amenity highway=traffic_signals =motorway_junction =bus_stop railway building entrance=yes barrier=gate barrier shop" > temp.osm`
- Extract names and export as csv `./osmconvert temp.osm --all-to-nodes --csv="name" > temp.csv`
- Sort alphabetically and discard duplicates `sort -u temp.csv > citydata/berlin_streetnames.txt`
- **Important:** Check manually and delete obvious errors. 
- Sort by length of string `cat citydata/berlin_streetnames.txt | awk '{ print length, $0 }' | sort -n -s | cut -d" " -f2- > citydata/berlin_streetnames_bylength.txt`
- **Important:** Check again manually for obvious errors

#### 4. Generate streets
1. Set cityname parameter (in Jupyter notebook) and execute `02_unwindbike.ipynb`
- Set cityname parameter (in Jupyter notebook) and execute `03_unwindrail.ipynb`
- Set cityname parameter (in Jupyter notebook) and execute `04_unwindstreet.ipynb`

### Generate Parking Spots

#### 1. Create svgs
1. Serve SVGnest-batch locally (e.g. `python3 -m http.server` or `python -m SimpleHTTPServer 8000`)
- Set cityname parameter and execute `05_parkingtosvgbike.ipynb` **step by step**. 
	- This involves executing SVGnest-batch inbetween!
	- **If SVGNest fails** → execute `06_parkingtosvgbikealt.ipynb` instead! 
	- In the end an SVG (all.svg) like following is created:  
![SVG of bike parking spots](assets/bikeparkingexample.png "SVG of car parking spots")

- Set cityname parameter and execute `07_parkingtosvgcar.ipynb` **step by step**. 
	- This involves executing SVGnest-batch inbetween!
	- In the end an SVG (all.svg) like following is created (shown rotated):  
![SVG of car parking spots](assets/carparkingexample.png "SVG of car parking spots")

#### 2. Add neighborhood information to SVG
[TBD]

### Generate Street Coils

## Team
[TBD]

## License
[TBD]

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