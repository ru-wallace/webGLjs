import { Game } from "./gameData.js";
import { generateShapes } from "./shapes.js";
import { GLInstance } from "./glFunctions.js";
import * as utils from "./utils.js";
import * as convert from "./conversions.js";
import * as geom from "./geometryFunctions.js";
import * as canv from "./canvasFunctions.js";

async function main() {
  const canvas = document.querySelector('#canvas');

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    alert('Failed to get the rendering context for WebGL');
    return;
  }

  const textCanvas = document.querySelector('#text-canvas');
  const textContext = textCanvas.getContext('2d');

  utils.resizeCanvasToDisplaySize(canvas);
  utils.resizeCanvasToDisplaySize(textCanvas);


  const game = new Game({
    glCanvas: canvas,
    textCanvas: textCanvas,
    centre: {
      lat: 55.525140,
      lon: -4.245913,
    },
    radius: 15,
    scale: 1.1,
    historySeparationDistanceNM: 0.25,
    removeOutOfBounds: true,
    showHistory: true,
  });

  const txtCanv = new canv.Canv(textCanvas, game.map, 12, "Arial", "white", "left");

  txtCanv.planeTextOffset.x = 20;
  txtCanv.planeTextOffset.y = 20;

  const south5nm = geom.calculateDestination(game.centre.lat, game.centre.lon, convert.nauticalMilesToMetres(5), 180);
  const east5nm = geom.calculateDestination(game.centre.lat, game.centre.lon, convert.nauticalMilesToMetres(5), 90);

  const navAids = [];
  navAids.push({
    name: "GOW",
    latitude: 55.521381,
    longitude: -4.26446,
    type: "VOR-DME",
    frequency: 115.5,
    range: 100,
  },
    {
      name: "VOR2",
      latitude: south5nm.lat,
      longitude: south5nm.lon,
      type: "VOR-DME",
      frequency: 115.5,
      range: 100,
    },
    {
      name: "GLW",
      latitude: 55.521117,
      longitude: -4.260106,
      type: "IDB",
      frequency: 115.5,
      range: 100,
    },

  );

  const end05lat = 55.514853;
  const end05lon = -4.265659;

  const end23lon = -4.245913;
  const end23lat = 55.524107;

  const middlelat = (end05lat + end23lat) / 2;
  const middlelon = (end05lon + end23lon) / 2;
  const runways = [];
  runways.push({
    bearing: 50,
    length: 2865,
    width: 46,
    latitude: middlelat,
    longitude: middlelon,
  });
  
  

  const plane1 = game.planeList.addRandomPlane("BAW123", "Boeing 737", "1234");

  const plane2 = game.planeList.addRandomPlane("BAW456", "Boeing 747", "5678");

  game.planeList.setTargetFlightLevel(plane1, 60);
  game.planeList.setTargetHeading(plane1, 90);
  game.planeList.setTargetSpeed(plane1, 500);

  console.log("Min Horizontal Separation: " + game.planeList.minimumHorizontalSeparation);
  console.log("To pixels: " + game.map.distanceMetresToPixels(game.planeList.minimumHorizontalSeparation));
  const shapes = generateShapes(game.map, {
    radarCircle: {
      radius: game.map.distanceMetresToPixels(convert.nauticalMilesToMetres(game.radarRadius)),
      nPoints: 100,
      lineWidth: 80
    },
    circle: {
      radius: game.map.distanceMetresToPixels(game.planeList.minimumHorizontalSeparation),
      nPoints: 100,
      lineWidth: 80
    },
    arrow: {
      width: 10,
      height: 20
    },
    rectangle: {
      width: 1,
      height: 1
    },
    filledCircle: {
      radius: 1,
      nPoints: 20
    }
  });

  const vsSource = await fetch('shader.vert').then(response => response.text());
  const fsSource = await fetch('shader.frag').then(response => response.text());


  const glO = new GLInstance(gl, vsSource, fsSource, shapes, game.map);
  let deltaTime = 0;
  let then = 0;

  glO.setViewport();
  glO.enableDepthTest();

  function render(now) {
    utils.resizeCanvasToDisplaySize(canvas);
    utils.resizeCanvasToDisplaySize(textCanvas);

    now *= 0.001; // convert to seconds

    deltaTime = now - then;
    then = now;

    glO.setViewport();
    txtCanv.clear();
    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    glO.clearCanvas();
    glO.drawRadarCircle([0.0, 0.5, 0.0, 1]);

    for (let i = 0; i < navAids.length; i++) {
      let navAid = navAids[i];
      let color = [0.0, 0.5, 0.0, 1];
      if (navAid.type === "VOR-DME") {
        color = [0.5, 0.5, 1.0, 1];
        glO.drawVorSymbol(navAid.latitude, navAid.longitude, color);
      } else if (navAid.type === "IDB") {
        color = [0.5, 1.0, 0.5, 1];
        glO.drawIdbSymbol(navAid.latitude, navAid.longitude, color);
      }
    }

    for (let i = 0; i < runways.length; i++) {
      let runway = runways[i];
      let color = [0.5, 0.5, 0.5, 1];
      glO.drawRunway(runway, color);
    }

    let separationIncidents = [];

    if (!game.pause) {
      game.planeList.updateAllPlanes(deltaTime); // update all planes
      separationIncidents = game.planeList.getSeparationIncidents(); // get separation incidents

    }

    let planeSeparationIncidentBoolArray = new Array(game.planeList.nPlanes).fill(false);

    for (let i = 0; i < separationIncidents.length; i++) {
      planeSeparationIncidentBoolArray[separationIncidents[i].plane1] = true;
      planeSeparationIncidentBoolArray[separationIncidents[i].plane2] = true;
    }

    for (let i = 0; i < game.planeList.nPlanes; i++) {
      let plane = game.planeList.getPlaneByIndex(i);
      let color = [0.0, 1.0, 0.0, 1];
      if (planeSeparationIncidentBoolArray[i]) {
        color = [1, 0, 0, 1];
      }
      glO.drawCircle(plane, color);
      glO.drawArrow(plane, color);
      glO.drawPlaneSpeedIndicator(plane, color);
      
      txtCanv.drawPlaneText(plane);


      if (game.showHistory) {
        //console.log("Plane: " + plane.flightNumber + " has history: " + plane.positionHistory.length);
        for (let j = 0; j < plane.positionHistory.length; j++) {
          let historyPoint = plane.positionHistory.getPosition(j);
          let distance = geom.calculateDistance(historyPoint.latitude, historyPoint.longitude, plane.latitude, plane.longitude);
          //console.log("Distance: " + distance);
          let scale = 2*(1 - (distance / (game.planeList.historyDistance*game.planeList.maxHistory)));
          glO.drawHistoryPoint(plane, j, [0.0, 0.8, 0.0, 1], scale);
        }
      }
      
    }

    if (now < 60) {
      requestAnimationFrame(render);
    }
    

  }

  requestAnimationFrame(render);
}

main();
