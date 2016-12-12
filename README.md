# lab-mobviz
A repo to collaborate on a data viz on the impact of new mobility on urban structures.

## Adding new cities (folder datapreparation)
Follow this order. If not noted otherwise, run commands in terminal. Examples for berlin.
### One-time preliminaries
- Get osmconvert.c. Set border__edge_M 1300004. Compile: gcc osmconvert.c -lz -O3 -o osmconvert
- Get osmfilter
- Get [QGIS][2]
- Get [Anaconda][1] (Python 3.5)
- Extra python libraries to install: pymongo, shapely, haversine, osmnx, networkx, pyprind
- Get mongosm from [https://github.com/stephanbogner/node-mongosm][3]. To get dependencies, run: npm install. 

### Workflow per city

#### Create geofiles
- Get shapefile of city boundary from somewhere. If nowhere found, use [Turbopass][4]: [out:json];
(
  node[boundary="administrative"][admin_level=6](48.46, 8.79, 48.93, 9.50);
  way[boundary="administrative"][admin_level=6](48.46, 8.79, 48.93, 9.50);
) ;(._;>;);out skel;
- Load file into QGIS, save as poly via Vector > Export OSM Poly (if necessary, first save as a duplicate with correct CRS)
- Download city osm.bz2 file from [geofabrik][6], e.g berlin-latest
- ./osmconvert berlin-latest.osm -B=berlin_boundary.poly --complex-ways --complete-ways -o=berlin_cropped.osm

#### Load into MongoDB
- In options.js of mongosm/lib: populateGeometry: false
- Run: node mongosm.js --max_old_space_size=8192 -db berlin_raw -f [OSMFILE]
- Set cityname parameter and execute generategeometries.ipynb

#### Street names
- ./osmfilter berlin_cropped.osm --keep="highway=residential =primary =secondary =tertiary =unclassified" --drop="public_transport=stop_position public_transport=platform public_transport man_made leisure amenity highway=traffic_signals railway=station entrance=yes barrier=gate barrier" > temp.osm
- ./osmconvert temp.osm --all-to-nodes --csv="name" > temp.csv
- sort -u temp.csv > citydata/berlin_streetnames.txt
- Check manually and delete obvious errors

#### Generate streets
- Set cityname parameter and execute unwindbike.ipynb
- Set cityname parameter and execute unwindrail.ipynb
- Set cityname parameter and execute unwindstreet.ipynb

#### Generate parking spots
- Run SVGNest with python3 -m http.server
- Set cityname parameter and execute parkingtosvgbike.ipynb **step by step**. This involves executing SVGNest inbetween!
- Set cityname parameter and execute parkingtosvgcar.ipynb **step by step**. This involves executing SVGNest inbetween!

[1]: https://www.continuum.io/downloads
[2]: http://www.qgis.org/
[3]: https://github.com/stephanbogner/node-mongosm
[4]: http://overpass-turbo.eu/
[5]: https://github.com/stephanbogner/SVGNest
[6]: http://download.geofabrik.de/