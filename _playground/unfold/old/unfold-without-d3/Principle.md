### Example Output from Michael
```
{
	"nodes": {
		"node1": {
			"lon": node1lon,
			"lat": node1lat
		},
		"node2": {
			"lon": node2lon,
			"lat": node2lat
		},
		"node3": {
			"lon": node3lon,
			"lat": node3lat
		},
		"node4": {
			"lon": node4lon,
			"lat": node4lat
		},
		"node5": {
			"lon": node5lon,
			"lat": node5lat
		},
		"node6": {
			"lon": node6lon,
			"lat": node6lat
		}
	},
	"tags": {
		"name": "Achillesstraße"
	},
	"components": [
		[
			["node1", "node2", "node3"]
		],
		[
			["node4", "node5"],
			["node5", "node6"]
		]
	]
}
```
Note: There are multiple components if the street is not one graph (e.g. a gap inbetween)

### Convert to coordinate based system
```
{
	"tags": {
		"name": "Achillesstraße"
	},
	"components": [
		[
			[
				{"lon": node1lon, "lat": node1lat}, 
				{"lon": node2lon, "lat": node2lat}, 
				{"lon": node3lon, "lat": node3lat}
			]
		],
		[
			[
				{"lon": node4lon, "lat": node4lat},
				{"lon": node5lon, "lat": node5lat}
			],
			[
				{"lon": node5lon, "lat": node5lat},
				{"lon": node6lon, "lat": node6lat}
			]
		]
	]
}
```

### Convert to Vector system
```
{
	"tags": {
		"name": "Achillesstraße"
	},
	"components": [
		[
			{
				"from": {"lon": node1lon, "lat": node1lat},
				"to": {"lon": node3lon, "lat": node3lat},
				"bearings": [bearing1, bearing2],
				"distances": [distance1, distance2],
				"coordinates": [
					{"lon": node1lon, "lat": node1lat}, 
					{"lon": node2lon, "lat": node2lat}, 
					{"lon": node3lon, "lat": node3lat}
				]
			}
		],
		[
			{
				"from": {"lon": node4lon, "lat": node4lat},
				"to": {"lon": node5lon, "lat": node5lat},
				"bearings": [bearing1, bearing2],
				"distances": [distance1, distance2],
				"coordinates": [
					{"lon": node4lon, "lat": node4lat}, 
					{"lon": node5lon, "lat": node5lat}
				]
			},
			{
				"from": {"lon": node5lon, "lat": node5lat},
				"to": {"lon": node6lon, "lat": node6lat},
				"bearings": [bearing1, bearing2],
				"distances": [distance1, distance2],
				"coordinates": [
					{"lon": node5lon, "lat": node5lat}, 
					{"lon": node6lon, "lat": node6lat}
				]
			}
		]
	]
}
```

### For displaying and animating
```
{
	"tags": {
		"name": "Achillesstraße"
	},
	"components": [
		[
			{
				"from": {"lon": node1lon, "lat": node1lat},
				"to": {"lon": node3lon, "lat": node3lat},
				"bearings": [bearing1, bearing2],
				"distances": [distance1, distance2],
				"coordinates": [
					{"lon": node1lon, "lat": node1lat}, 
					{"lon": node2lon, "lat": node2lat}, 
					{"lon": node3lon, "lat": node3lat}
				],
				"currently": {
					bearings: [currentBearing1, currentBearing2],
					"to": {"lon": tailEndLon, "lat": tailEndLat}
				}
			}
		],
		...
	]
}
```