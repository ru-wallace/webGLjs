import { Game } from "./gameData.js";
import * as shapeFuncs from "./shapes.js";
import { GLInstance } from "./glFunctions.js";
import * as utils from "./utils.js";
import * as convert from "./conversions.js";
import * as geom from "./geometryFunctions.js";
import * as canv from "./canvasFunctions.js";

async function main()
{
  const canvas = document.querySelector('#canvas');

  const gl = canvas.getContext('webgl2');
  if (!gl)
  {
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
      lat: 55.869772,
      lon: -4.433617,
    },
    radius: 16,
    scale: 1.1,
    historySeparationDistanceNM: 0.25,
    removeOutOfBounds: true,
    showHistory: true,
  });

  const txtCanv = new canv.Canv(textCanvas, game.map, 12, "Arial", "white", "left");

  txtCanv.planeTextOffset.x = 20;
  txtCanv.planeTextOffset.y = 20;

  const navAids = [];
  navAids.push({
    name: "GOW",
    latitude: 55.869772,
    longitude: -4.433617,
    type: "VOR-DME",
    frequency: 115.5,
    range: 100,
  },
    {
      name: "CVL",
      latitude: 56.02460152231144,
      longitude: -4.076019368863338,
      type: "VOR-DME",
      frequency: 115.5,
      range: 100,
    },
    {
      name: "GLW",
      latitude: 55.870507,
      longitude: -4.445715,
      type: "IDB",
      frequency: 115.5,
      range: 100,
      labelDirection: "NW"
    },

  );

  console.log("Distance GOW to CVL: " + convert.metresToNauticalMiles(geom.calculateDistance(navAids[0].latitude, navAids[0].longitude, navAids[1].latitude, navAids[1].longitude)));

  const end05lat = 55.863473;
  const end05lon = -4.449054;

  const end23lon = -4.421762;
  const end23lat = 55.878078;

  const middlelat = (end05lat + end23lat) / 2;
  const middlelon = (end05lon + end23lon) / 2;
  const runways = [];
  runways.push({
    bearing: 50,
    labels: ["05", "23"],

    activeApproach: "05",
    length: 2865,
    width: 46,
    latitude: middlelat,
    longitude: middlelon,
    altitude: convert.feetToMetres(26),
    approaches: [{
      type: "ILS",
      runway: "05",
      bearing: 50,
      frequency: 110.5,
      length: convert.nauticalMilesToMetres(10),
      glideslope: 3,
    },
    {
      type: "ILS",
      runway: "23",
      bearing: 230,
      frequency: 110.5,
      length: convert.nauticalMilesToMetres(10),
      glideslope: 3,
    }
    ]
  });



  const plane1 = game.planeList.addRandomPlane("BAW123", "Boeing 737", "1234");

  const plane2 = game.planeList.addRandomPlane("BAW456", "Boeing 747", "5678");

  game.planeList.setTargetFlightLevel(plane1, 60);
  game.planeList.setTargetHeading(plane1, 315);
  game.planeList.setTargetSpeed(plane1, 150);

  console.log("Min Horizontal Separation: " + game.planeList.minimumHorizontalSeparation);
  console.log("To pixels: " + game.map.distanceMetresToPixels(game.planeList.minimumHorizontalSeparation));
  const shapes = shapeFuncs.generateShapes({
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

  var nearestPlane;
  var mouseLatLon;

  function render(now)
  {
    utils.resizeCanvasToDisplaySize(canvas);
    utils.resizeCanvasToDisplaySize(textCanvas);

    now *= 0.001; // convert to seconds

    deltaTime = (now - then);
    then = now;

    game.tick(deltaTime);

    glO.setViewport();
    txtCanv.clear();
    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    glO.clearCanvas();
    glO.drawRadarCircle([0.0, 0.5, 0.0, 1]);

    for (let i = 0; i < navAids.length; i++)
    {
      let navAid = navAids[i];
      txtCanv.drawNavAidText(navAid);
      let color = [0.0, 0.5, 0.0, 1];
      if (navAid.type === "VOR-DME")
      {
        color = [0.5, 0.5, 1.0, 1];
        glO.drawVorSymbol(navAid.latitude, navAid.longitude, color);
      } else if (navAid.type === "IDB")
      {
        color = [0.5, 1.0, 0.5, 1];
        glO.drawIdbSymbol(navAid.latitude, navAid.longitude, color);
      }
    }

    for (let i = 0; i < runways.length; i++)
    {
      let runway = runways[i];
      let color = [0.5, 0.5, 0.5, 1];
      glO.drawRunway(runway, color);
      if (runway.approaches !== undefined)
      {
        color = [0.5, 0.5, 1.0, 1];
        glO.drawIlsApproach(runway, color);
      }
    }

    let separationIncidents = [];



    if (!game.pause && game.planeList.nPlanes > 0)
    {
      separationIncidents = game.planeList.getSeparationIncidents(); // get separation incidents

    }

    mouseLatLon = game.map.xyToLatLon(game.mouseX, game.mouseY);

    nearestPlane = game.planeList.getNearestPlane(mouseLatLon.lat, mouseLatLon.lon);



    if (nearestPlane != null)
    {

      if (nearestPlane.distance < game.planeList.minimumHorizontalSeparation / 2)
      {
        game.planeList.setHoveredPlane(nearestPlane.index);
      } else
      {
        game.planeList.setHoveredPlane(-1);
      }
    }

    var displayPlane = game.planeList.getSelectedPlaneIndex();
    if (displayPlane == -1)
    {
      displayPlane = game.planeList.getHoveredPlaneIndex();
    }

    let planeSeparationIncidentBoolArray = new Array(game.planeList.nPlanes).fill(false);

    for (let i = 0; i < separationIncidents.length; i++)
    {
      planeSeparationIncidentBoolArray[separationIncidents[i].plane1] = true;
      planeSeparationIncidentBoolArray[separationIncidents[i].plane2] = true;
    }

    for (let i = 0; i < game.planeList.nPlanes; i++)
    {
      let plane = game.planeList.getPlaneByIndex(i);


      let circleColor = [0.0, 1.0, 0.0, 1];
      let arrowColor = circleColor;
      let speedIndicatorColor = circleColor;

      if (planeSeparationIncidentBoolArray[i])
      {
        circleColor = [1, 0, 0, 1];
      }

      var showTarget = false;

      let targetHeadingColor = [0.0, 0.0, 0.0, 0.0];
      if (i == displayPlane)
      {
        arrowColor = [1.0, 1.0, 1.0, 1];
        targetHeadingColor = [1.0, 1.0, 0.0, 1];
        showTarget = true;

        const distanceToIntercept = geom.calculateDistanceToIntercept(plane.latitude, plane.longitude, plane.heading, runways[0].latitude, runways[0].longitude, runways[0].approaches[0].bearing);
        
        if (distanceToIntercept !== null) 
        {
          var angleToIntercept = Math.abs(plane.heading - runways[0].approaches[0].bearing);
          if (angleToIntercept > 180)
          {
            angleToIntercept = 360 - angleToIntercept;
          }
          

          const distanceToInterceptNM = convert.metresToNauticalMiles(distanceToIntercept);
        
          document.querySelector("#dti").innerText = distanceToInterceptNM.toFixed(2);  
          document.querySelector("#ati").innerText = angleToIntercept.toFixed(2);

          if (angleToIntercept < 60)
          {
            const angleToInterceptRad = convert.degreesToRadians(angleToIntercept);

            const turnRadius = Math.abs(game.planeList.getTurnRadius(plane.index));

            const turnCentreDistanceToIntercept = Math.abs((Math.abs(distanceToIntercept) + turnRadius) * Math.sin(angleToInterceptRad));
            //console.log("turn radius: " + turnRadius);
            //console.log("turn Centre distance to intercept: " + turnCentreDistanceToIntercept);
            //console.log("distance to turn start:" + Math.abs(turnCentreDistanceToIntercept - turnRadius))
            if (Math.abs(turnCentreDistanceToIntercept - turnRadius) < 10 && distanceToInterceptNM > 0)
            {
              console.log("LOCALISING");
              if (plane.targetHeading != runways[0].approaches[0].bearing)
              {
                game.planeList.setTargetHeading(plane.index, runways[0].approaches[0].bearing);
                game.planeList.setTargetSpeed(plane.index, 180);

              }

            }
          }
        } else
        {
          document.querySelector("#dti").innerText = "N/A";
          document.querySelector("#ati").innerText = "N/A";
        }
      }




      let historyColor = [0.0, 0.8, 0.0, 1];

      if (game.showHistory)
      {
        //console.log("Plane: " + plane.callSign + " has history: " + plane.positionHistory.length);
        for (let j = 0; j < plane.positionHistory.length; j++)
        {
          let historyPoint = plane.positionHistory.getPosition(j);
          let distance = geom.calculateDistance(historyPoint.latitude, historyPoint.longitude, plane.latitude, plane.longitude);
          //console.log("Distance: " + distance);
          let scale = 2 * (1 - (distance / (game.planeList.historyDistance * game.planeList.maxHistory)));
          glO.drawHistoryPoint(plane, j, historyColor, scale);
        }
      }


      glO.drawPlane(plane, showTarget, circleColor, arrowColor, speedIndicatorColor, targetHeadingColor);
      txtCanv.drawPlaneText(plane);


    }

    if (now >= 0)
    {
      requestAnimationFrame(render);
    }


  }

  requestAnimationFrame(render);
}

main();
