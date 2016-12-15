# Add districts to svg
## About
Iterates over a parking space svg and adds the districts to the svg

## Install
Run `npm install`

## Run
Navigate (with Terminal) to directory and run `node index.js` (the script will give you instructions on how to run it)

## Example OverpassTurbo Query to obtain districts
```
[out:json][timeout:25];
(
  relation["admin_level"="10"]({{bbox}});
);
out body;
>;
out skel qt;
```