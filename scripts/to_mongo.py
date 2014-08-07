import re
import json
import pymongo
import numpy as np


connection = pymongo.Connection()

connection.drop_database('bordeaux3d')

database = connection['bordeaux3d']
collection = database['buildings']

database["buildings"].create_index([("loc", pymongo.GEO2D)])

def linX(x, X):
    return -.575803 + (-.575803+0.570726)/(123*200-125*200) * (X*200+ x - 123*200)

def linY(y, Y):
    return 44.839642 + (44.841441 - 44.839642)/(112*200 - 113*200) * (Y*200 + y - 113*200)


with open('front/models/list.json', 'r') as the_file: 
	output_file_list = json.loads(the_file.read())

for tile in output_file_list:
	buildings_files = tile.values()[0]
	X, Y = re.match("x(\d+)y(\d+)",tile.keys()[0].split(".")[0]).groups(1)
	X, Y = float(X), float(Y)
	for buildings_file in buildings_files + [tile.keys()[0]]:
		with open("front/models/" + buildings_file, 'r') as the_file: 
			building = json.loads(the_file.read())

			# change the vertices to have longitude latitude
			vertices = np.array(building["vertices"]).reshape((-1,3)).T  
			xx = map(lambda x: x + X * 200, vertices[0])
			yy = map(lambda y: y + Y * 200, vertices[2])
			modified_vertices = np.array([xx, vertices[1], yy]) 
			building["vertices"] = list(modified_vertices.T.flatten())

			# compute the longitude latitude of the center
			lon = np.mean(map(lambda x: linX(x, X), vertices[1]))
			lat = np.mean(map(lambda y: linY(y, Y), vertices[2]))		

			collection.insert({'_id': buildings_file, 'data': building, 'loc': [lon, lat], 'X' : X, 'Y' : Y})


# we'll transform x,y ranging from -100 to 100 in 4096 int values
def transform(x):
    return int((x+100)*(4095)/200)

# we'll transform z ranging from -10 to 117 in 255 int values
def transformZ(z):
    return int((z-117)*(255)/(117+10))


def encode(triplet):
    [x,y,z] = [transform(triplet[0]), transform(triplet[1]), transformZ(triplet[3])]
    return x << 20 + y << 8 + z










