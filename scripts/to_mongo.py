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

# we'll transform x,y ranging from -nbx to nbx in 4096 int values
nbx = 150
def transform(x):
    return int((x+nbx)*(4095)/(2*nbx))

nbz1, nbz2 = -10, 117
# we'll transform z ranging from nbz1 to nbz2 in 255 int values
def transformZ(z):
    return int((z-nbz2)*(255)/(nbz2-nbz1) + 255)


def encode(triplet):
    [x,y,z] = [transform(triplet[0]), transformZ(triplet[1]), transform(triplet[2])]
    if x < 0 or x>4095 or z < 0 or z>4095 or y<0 or y>255:
    	print triplet
    	print "alert %d %d %d" % (x,y,z)
    return (x << 20) + (y << 4) + z



with open('front/models/list.json', 'r') as the_file: 
	output_file_list = json.loads(the_file.read())

for tile in output_file_list:
	buildings_files = tile.values()[0]
	X, Y = re.match("x(\d+)y(\d+)",tile.keys()[0].split(".")[0]).groups(1)
	X, Y = float(X), float(Y)
	for buildings_file in buildings_files + [tile.keys()[0]]:
		with open("front/models/" + buildings_file, 'r') as the_file: 
			building = json.loads(the_file.read())

			vertices = np.array(building["vertices"]).reshape((-1,3)).T
			xx = map(lambda x: x , vertices[0])
			yy = map(lambda y: y , vertices[2])
			modified_vertices = np.array([xx, vertices[1], yy]) 
			building["vertices"] = list(modified_vertices.T.flatten())

			# # here is the version where we compress in a int 32
			# vertices = np.array(building["vertices"]).reshape((-1,3))
			# modified_vertices = map(encode, vertices)
			# building["vertices"] = list(modified_vertices)

			# # and in javascript:
			# var raw = vertices[ offset ++];
			# var myx = ( raw & 0xfff00000) >> 20;
			# var myy = ( raw & 0x000ff000) >> 4;
			# var myz = ( raw & 0x00000fff);



			# compute the longitude latitude of the center
			lon = np.mean(map(lambda x: linX(x, X), vertices[1]))
			lat = np.mean(map(lambda y: linY(y, Y), vertices[2]))		

			collection.insert({'_id': buildings_file, 'data': building, 'loc': [lon, lat], 'X' : X, 'Y' : Y})












