import sys
import re
import glob
import os
import bpy

sys.path.append("/Applications/blender.app/Contents/MacOS/2.71/scripts/addons/")


from io_mesh_threejs.export_threejs import save as toThree
from io_scene_3ds.import_3ds import load_3ds


def export(inputfile, outputfile):

	# get the coordinates
	X, Y = re.match("\w+_x(\d+)y(\d+)", inputfile.split("/")[-2]).groups(1)
	X, Y = float(X), float(Y)

	# load the scene
	load_3ds(inputfile, bpy.context)

	# # rescale and translate
	# obj = bpy.data.objects[0]
	# [scx, scy, scz] = obj.scale
	# obj.scale = [0.5/scx, 0.5/scy, 0.5/scz]
	# obj.location = [X,Y,0]

	# export the mesh
	toThree(bpy.ops.export_mesh, bpy.context, outputfile)

	# clean
	candidate_list = [item.name for item in bpy.data.objects if item.type == "MESH"]
	for object_name in candidate_list:
		bpy.data.objects[object_name].select = True
	bpy.ops.object.delete()
	 for item in bpy.data.meshes:
		bpy.data.meshes.remove(item)


# removing the initial cube
ob = bpy.context.object
bpy.context.scene.objects.unlink(ob)
bpy.data.objects.remove(ob)


files = glob.glob("/Users/vallette/Desktop/RL/tile_x*y*/tile_x*y*.3ds")
for (i, inputfile) in enumerate(files[:0]):
	print ("Processing " + inputfile)
	outputfile = "front/models/blender_%s.js" % str(i)
	export(inputfile, outputfile)
	directory = "/".join(inputfile.split("/")[:-1])
	os.system("cp %s/*.jpg front/models/" % directory)