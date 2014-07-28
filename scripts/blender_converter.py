import sys
import re
import glob
import os
import bpy
import json

sys.path.append("/Applications/blender.app/Contents/MacOS/2.71/scripts/addons/")


from io_mesh_threejs.export_threejs import save as toThree
from io_scene_3ds.import_3ds import load_3ds


def export(inputfile, outputdir):

	# get the coordinates
	X, Y = re.match("\w+_x(\d+)y(\d+)", inputfile.split("/")[-2]).groups(1)
	X, Y = float(X), float(Y)

	# load the scene
	load_3ds(inputfile, bpy.context)
	buildings = []

	for o in bpy.data.objects:
		o.select = False
	for o in bpy.data.objects:
		o.select = True
		if o.name[0] != "$":
			toThree(bpy.ops.export_mesh, bpy.context, outputdir + o.name + ".js", option_all_meshes=False)

			if o.name[0] == "x":
				master = o.name
			else:
				buildings += [o.name + ".js"]
		o.select = False


	# clean
	candidate_list = [item.name for item in bpy.data.objects if item.type == "MESH"]
	for object_name in candidate_list:
		bpy.data.objects[object_name].select = True
	bpy.ops.object.delete()
	for item in bpy.data.meshes:
		bpy.data.meshes.remove(item)

	return {master + ".js" : buildings}


# removing the initial cube
ob = bpy.context.object
bpy.context.scene.objects.unlink(ob)
bpy.data.objects.remove(ob)


output_file_list = []
files = glob.glob("/Users/vallette/Desktop/RL/tile_x*y*/tile_x*y*.3ds")
for inputfile in files[:3]:
	print ("Processing " + inputfile)
	outputdir = "front/models/"
	outfile = export(inputfile, outputdir)
	output_file_list += [outfile]
	directory = "/".join(inputfile.split("/")[:-1])
	os.system("cp %s/*.jpg front/models/" % directory)
	with open('front/models/list.json', 'w') as the_file: the_file.write(json.dumps(output_file_list))

