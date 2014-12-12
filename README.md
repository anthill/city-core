# Bordeaux 3d

A project to visualize Bordeaux and the CUB in 3D. Based on [Open Data](http://data.lacub.fr/data.php?themes=1&layer=344).

This project is the core of Bordeaux3D.
It contains the core features:
* Tools to process the raw data and prepare it for efficient server->client transport
* Server-side serving the 3D objects (using socket.io currently)
* index.html file
* Three.js scene creation
* Client-side scripts to load the data for the 3D objects and add them to the Three.js scene
* Client-side API


Everything else should be features added that interact with the client-side API.
* Lights
* Shadows
* Cameras



# How to make this all work

1. Get the 3D data

* Right now the 3D data has to be downloaded via the [dedicated GUI](http://data.lacub.fr/graphic_downloader.php?layer=344&format=76). Once you have it, put it somewhere. It should be a .zip archive named `BATI3D_NT.zip` or equivalent.
* Altitude data in CSV format can be found in the [CUB data website](http://data.lacub.fr/data.php?themes=1&layer=344) (under "découpage des dalles 3D"). They should be put under `data/DALLAGE_3D.csv`.

1. `git clone` the project
1. `npm install`

1. Extract all the buildings and metadata in `front/data`:

```bash
node tools/unzipCUB3ds.js --out front/data/ --zip path/to/3Ddata/BATI3D_NT.zip
```

It should take about 5 minutes in normal hardware. This will extract all the buildings and other 3d objects from the open data in [.3ds format](http://en.wikipedia.org/wiki/.3ds). It will create thousands of binary files in `front/data/` as well as a file names `metadata.json`.

```bash
npm run build
npm start-dev
```

1. Open http://localhost:9000

# Dev

```bash
npm run watch
```

# Licence

[MIT](LICENCE)
