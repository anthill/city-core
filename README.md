# Bordeaux 3d

A project to visualize Bordeaux and the CUB in 3D. Based on [Open Data](http://data.lacub.fr/data.php?themes=1&layer=344).


# How to make this all work

1. Get the 3D data

Right now the data has to be downloaded via the [dedicated GUI](http://data.lacub.fr/graphic_downloader.php?layer=344&format=76). Once you have it, put it somewhere. It should be a .zip archive named `BATI3D_NT.zip` or equivalent.

1. `git clone` the project
1. `npm install`
1. `npm install -g browserify`

1. Extract all the buildings and metadata in `front/data`:

```bash
node tools/unzipCUB3ds.js --out front/data/ --zip path/to/3Ddata/BATI3D_NT.zip
```

It should take about 5 minutes in normal hardware. This will extract all the buildings and other 3d objects from the open data in [.3ds format](http://en.wikipedia.org/wiki/.3ds). It will create thousands of binary files in `front/data/` as well as a file names `metadata.json`.

1. `browserify front/src/main.js  -o front/app.js -v -d`

1. Start the server

`````bash
node index.js
```

1. Open http://localhost:3000

# Dev

1. `npm install -g watchify`

> watchify front/src/main.js  -o front/app.js -v -d


# Licence

[MIT](LICENCE)