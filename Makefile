BLENDER_DIR=/Applications/blender.app/
CUB_3D_DIR=/Users/vallette/Desktop/RL/tile_x119y112/

all: convert
.PHONY: convert

convert:
	@rm -fr front/models/
	@mkdir front/models/
	$(BLENDER_DIR)/Contents/MacOS/blender --background --python scripts/blender_converter.py


server:
	cd front && python -m SimpleHTTPServer 8000