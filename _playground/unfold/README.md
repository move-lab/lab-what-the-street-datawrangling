# Unravelling
## What we do

### 1. Data Structure
An object containing **nodes**, **tags** and **components**.

#### 1. Nodes
An object containing **latitude** and **longitude**, the **key** being the OSM node-ID.

```
"4294120258": {
	"lon": 13.4857248,
	"lat": 52.6209406
}
```

#### 2. Tags
An object containing all tags from OSM. 

```
"tags": {
	"name": "Achillesstraße"
}
```

#### 3. Components
An array consisting of components. Every component is one part of a street. There are only multiple components if the street is interrupted by a gap (e.g. by a bridge which does not belong to the street). Every subcomponent is a continuos path with any splits.

```
"components": [
	[
		["97938288", "2316363558", "676556800"]
	],
	[
		["97941041", "98042653"],
		["98043012", "1279155596", "4406456891"],
		["98042801", "1279155595", "4406456910", "4406456917"],
		["4406456910", "1289141493", "98042473"]
	]
]
```

### 2. Convert Nodes and Way based system to line based system