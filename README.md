# lab-mobviz
A repo to collaborate on a data viz on the impact of new mobility on urban structures.

## Adding new cities (folder datapreparation)
Follow this order. If not noted otherwise, run commands in terminal. Examples for berlin.
### One-time preliminaries
- Get [osmconvert.c][8]. Set `border__edge_M 1300004` so it can handle larger poly files. Compile: `gcc osmconvert.c -lz -O3 -o osmconvert`
- Get [osmfilter][9]
- Get [MongoDB][11]
- Get [QGIS][2], install the osmpoly_export plugin
- Get [Anaconda][1] (Python 3.5)
- Extra python libraries to install: pymongo, shapely, haversine, [osmnx][10] (first rtree!), pyprind
- Get mongosm from [Stephan Bogner's fork][3], and in options.js of mongosm/lib, set `populateGeometry: false`. To get dependencies, run: `npm install` 

### Workflow per city

#### Create geo files
- Get shapefile of city boundary from somewhere. If nowhere found, use [Turbopass][4], mind [the correct admin_level][7]:  
`[out:json];  
(
  node[boundary="administrative"][admin_level=6](48.46, 8.79, 48.93, 9.50);
  way[boundary="administrative"][admin_level=6](48.46, 8.79, 48.93, 9.50);
) ;(._;>;);  
out skel;`
- Load file into QGIS, save as a duplicate with correct CRS: EPSG:4326, and save as berlin_boundary.poly via Vector > Export OSM Poly
- Download and unpack osm.bz2 file that contains the city from [geofabrik][6], e.g berlin-latest
- `./osmconvert berlin-latest.osm -B=berlin_boundary.poly --complex-ways --complete-ways -o=berlin_cropped.osm`

#### Load into MongoDB
- `node mongosm.js --max_old_space_size=8192 -db berlin_raw -f berlin_cropped.osm`
- Set cityname parameter and execute generategeometries.ipynb

#### Street names
Note: osmfilter seems buggy and does not actually remove some things we want removed. That's why we need to manually remove them in the end.  

- `./osmfilter berlin_cropped.osm --keep="highway=residential =primary =secondary =tertiary =unclassified" --drop="public_transport=stop_position public_transport=platform public_transport man_made boundary leisure amenity highway=traffic_signals =motorway_junction =bus_stop railway building entrance=yes barrier=gate barrier shop" > temp.osm`
- `./osmconvert temp.osm --all-to-nodes --csv="name" > temp.csv`
- `sort -u temp.csv > citydata/berlin_streetnames.txt`
- Check manually and delete obvious errors. Good idea to re-iterate this step after the length sort, which reveals many errors:
- `cat citydata/berlin_streetnames.txt | awk '{ print length, $0 }' | sort -n -s | cut -d" " -f2- > citydata/berlin_streetnames_bylength.txt`

#### Generate streets
- Set cityname parameter and execute unwindbike.ipynb
- Set cityname parameter and execute unwindrail.ipynb
- Set cityname parameter and execute unwindstreet.ipynb

#### Generate parking spots
- Run SVGNest with `python3 -m http.server`
- Set cityname parameter and execute parkingtosvgbike.ipynb **step by step**. This involves executing SVGNest inbetween! **If SVGNest fails** (never finishes packing), execute parkingtosvgbikealt.ipynb instead! An SVG is generated:  
![SVG of bike parking spots](datapreparation/output/viennabikeout/all_small.png "SVG of car parking spots")

- Set cityname parameter and execute parkingtosvgcar.ipynb **step by step**. This involves executing SVGNest inbetween! An SVG is generated (shown rotated):  
![SVG of car parking spots](datapreparation/output/newyorkcarout/all_small.png "SVG of car parking spots")


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