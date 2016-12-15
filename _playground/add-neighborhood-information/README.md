<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Add districts to svg](#add-districts-to-svg)
  - [About](#about)
  - [Install](#install)
  - [Run](#run)
  - [Example OverpassTurbo Query to obtain districts](#example-overpassturbo-query-to-obtain-districts)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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