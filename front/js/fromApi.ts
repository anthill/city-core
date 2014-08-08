/// <reference path="./defs/three.d.ts" />
/// <reference path="./defs/jquery.d.ts" />


declare var dat;
declare var Promise;
declare var myJsonParser;


(function(){
  "use strict";
  // Set up the scene, camera, and renderer as global variables.
  var scene, camera, renderer, controls;
  var camx,camy,camz;
  var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;


  // setup the gui
  var guiControls = {
    address : "Place Peyberland, Bordeaux",
    altitude : 500,
    hour : 14,
    winter : false
  };
  var gui = new dat.GUI();
  var addressControl = gui.add(guiControls, 'address');
  var altitudeControler = gui.add(guiControls, 'altitude',100,1000);
  var hourControler = gui.add(guiControls, 'hour',0, 24);
  var seasonControler = gui.add(guiControls, 'winter',false);
  

  // Sets up the scene.
  function init() {

    // Create the scene and set the scene size.
    scene = new THREE.Scene();

    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    document.body.appendChild(renderer.domElement);


    // Create an event listener that resizes the renderer with the browser window.
    window.addEventListener('resize', function() {
      var WIDTH = window.innerWidth,
          HEIGHT = window.innerHeight;
      renderer.setSize(WIDTH, HEIGHT);
      camera.aspect = WIDTH / HEIGHT;
      camera.updateProjectionMatrix();
    });

    // Set the background color of the scene.
    renderer.setClearColorHex(0x333F47, 1);


    var axes = new THREE.AxisHelper( 200000 );
    scene.add(axes);

    // Create a camera, zoom it out from the model a bit, and add it to the scene.
    camera = new THREE.PerspectiveCamera( 30, WIDTH / HEIGHT, 1, 1000 );
    scene.add(camera);


    function moveCamera(ncamx, ncamy, ncamz) {
      camx = ncamx;
      camy = ncamy;
      camz = ncamz
      camera.position.x = camx;
      camera.position.y = camy;
      camera.position.z = camz;
      camera.up.set( 0, 0, -1 );
      camera.lookAt(new THREE.Vector3( camx, 0, camz ));

      // visible bounding box
      var L = 2 * camy * Math.tan(3.14*camera.fov/(2*180));
      var l = L * WIDTH / HEIGHT;
      console.log(camera.position.x,camera.position.z);
      console.log(L, l);
      console.log("----------");
      var south = camera.position.z - L/2;
      var north = camera.position.z + L/2;
      var east = camera.position.x - l/2;
      var west = camera.position.x + l/2;

      loadTiles(linY(south), linY(north), linX(east), linX(west));
    };

    geoCode("peyberland bordeaux").then(coords => {
      moveCamera(invLinX(coords.lon), 300, invLinY(coords.lat));
    })

    


    function moveLight() { 
      // Create a light, set its position, and add it to the scene.
      var date = new Date(2014, curMonth, 5, curHour, 0, 0);
      var lonLatBordeaux = [-0.6056232, 44.8272294];
      var sunPosition = getSunPosition(date, lonLatBordeaux[1], lonLatBordeaux[0]);
      var radius = 30000;
      var lightX = radius * Math.cos(sunPosition.azimuth+3.14);
      var lightY = radius * Math.sin(sunPosition.azimuth+3.14);
      var lighZ = radius * Math.tan(sunPosition.altitude);
      console.log(lightX, lighZ, lightY);
      light.position.set(lightX, lighZ, lightY);
      // pointer.position.set(lightX, lighZ, lightY);
    };

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.castShadow = true;
    light.shadowDarkness = 0.6;
    light.shadowMapWidth = 2048;
    light.shadowMapHeight = 2048;
    scene.add(light);

    // var radius = 10,
    // segments = 16,
    // rings = 16;
    // var sphere = new THREE.SphereGeometry(radius,segments,rings);
    // var pointer = new THREE.Mesh( sphere, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
    // scene.add( pointer );
    // moveLight();


    // global variables for time
    var curHour = guiControls.hour;
    var seasonsMonth = [7, 11];
    var curMonth = guiControls.winter ? seasonsMonth[1] : seasonsMonth[0];


    function linX(x) {
      return -0.575803 + (-0.575803+0.570726)/(123*200-125*200) * (x - 123*200);
    }
    
    function linY(y) {
      return 44.839642 + (44.841441 - 44.839642)/(112*200 - 113*200) * (y - 113*200);
    }
    function invLinX(x) {
      return (x + 0.575803)*(123*200-125*200)/(-0.575803+0.570726) + 123*200;
    }
    function invLinY(y) {
      return (y - 44.839642)*(112*200 - 113*200)/(44.841441 - 44.839642) + 113*200;
    }
    

    addressControl.onFinishChange(function(value) {
      geoCode(value).then(coords => {
        moveCamera(invLinX(coords.lon), camy, invLinY(coords.lat));
      })
    });

    altitudeControler.onFinishChange(function(value) {
      camy = guiControls.altitude;
      moveCamera(camx, camy, camz);
    });

    hourControler.onChange(function(value) {
      moveLight();
    });

    seasonControler.onChange(function(value) {
      moveLight();
    });


    // Add OrbitControls so that we can pan around with the mouse.
    controls = new PanZoomControls(camera, renderer.domElement);
  }


  // Renders the scene and updates the render as needed.
  function animate() {

    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    requestAnimationFrame(animate);
    
    // Render the scene.
    renderer.render(scene, camera);
    controls.update();

  }


  function geoCode(address) {
    var url="http://maps.googleapis.com/maps/api/geocode/json?address=";
    
    return new Promise(resolve => {
      $.getJSON(url+address,function(json){
          var lon = json.results[0].geometry.location.lng;
          var lat = json.results[0].geometry.location.lat;
          console.log(lon,lat);
          resolve({lon : lon, lat : lat});
        });
    });
  }

  function loadTiles(south, north, east, west) {
    var promise = new Promise(resolve => {
      $.getJSON("http://localhost:8080/getObjects?west="+west.toString()+"&south="+south.toString()+"&east="+east.toString()+"&north="+north.toString(), function(list) {
        resolve(list);
      });
    });

    promise.then(data => data.forEach(function(elem) {

      var object3d = JSON.parse(elem);
      var loader = new THREE.JSONLoader();
      var result = loader.parse( object3d.data, "../models/" )
      var material = new THREE.MeshFaceMaterial(result.materials);
      var mesh = new THREE.Mesh(result.geometry, material);
      mesh.position.set(object3d.X * 200, 0, object3d.Y * 200)
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      renderer.render(scene, camera);
    }));

  }

  init();
  animate();


})()


