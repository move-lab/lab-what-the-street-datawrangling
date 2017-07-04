'''
A script that gets all the svg file heights and stores them into a json
'''

import os, sys
from svgpathtools import svg2paths, wsvg, svg2paths2
import simplejson
import json


def getSvgAttribute(ifile):
	paths, attributes, svg_attributes = svg2paths2(ifile)
	return svg_attributes

def getHeight(svgAttribute):
	return svgAttribute['height'][0:-2]

def updateCityMeta(metaDataFile, featureHeights):
	with open(metaDataFile) as json_data:
		
		cityMeta = json.load(json_data)

		for city in featureHeights:
			currentCity = city['city']
			# print cityMeta[currentCity]["moving"]["rail"]
			# print cityMeta[currentCity]['moving']["car"]
			# print cityMeta[currentCity]['moving']["bike"]
			# print cityMeta[currentCity]['parking']["rail"]
			cityMeta[currentCity]["moving"]["rail"]["svgHeight"] = float(city["heights"]["rail-tracks"])
			cityMeta[currentCity]["moving"]["car"]["svgHeight"] = float(city["heights"]["car-tracks"])
			cityMeta[currentCity]["moving"]["bike"]["svgHeight"] = float(city["heights"]["bike-tracks"])
			cityMeta[currentCity]["parking"]["rail"]["svgHeight"] = float(city["heights"]["rail-parking"])

		f = open(rootdir+'/citymetadata_updated.json', 'w')
		simplejson.dump(cityMeta, f, indent=3, encoding='utf-8')
		f.close()
		print("CityMeta Updated written to file!")



def main():

	# get all the city directories
	for root, dirs, files in os.walk(rootdir):
		if(root.split("/")[-1] != "coils MongoDB Dump"):
			cityName = root.split("/")[-1]
			cityJson = {"path": root, "city":cityName, "heights": {"bike-tracks":0, "car-tracks":0, "rail-parking":0, "rail-tracks":0}}
			outputData.append(cityJson);
	outputData.pop(0)

	for city in outputData:
		for d in os.listdir(city["path"]):
			featurePath = os.path.join(city["path"], d)
			if os.path.isfile(featurePath) and d.endswith('.svg'):
				print('Analyzing ' + featurePath)
				featureSvgAttribute = getSvgAttribute(featurePath)
				# print(featureSvgAttribute)

				featureName = d[0:-4]
				city['heights'][featureName] = getHeight(featureSvgAttribute);
				print(' = ' + city['heights'][featureName] + 'px')
				print

	f = open(rootdir + '/featureHeights.json', 'w')
	simplejson.dump(outputData, f)
	f.close()

	# update the cityMetaData
	updateCityMeta(cityMetafile, outputData);

	print(outputData)

if __name__ == '__main__':
	rootdir = "/Users/stephan/Google Drive/mobviz/Data/3 - Data for Production (Alternative)/"
	cityMetafile = '/Users/stephan/Google Drive/mobviz/Data/3 - Data for Production (Alternative)/citymetadata.json'
	outputData = [];

	main()
