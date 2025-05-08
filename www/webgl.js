import { initBuffers } from "./init-buffers.js";
import { clearErrorQueue, checkError, bufferCircleIndices, bufferCirclePoints, bufferTrianglePoints, bufferTriangleIndices, bufferPointsData, bufferIndicesData, clearCanvas, createMatrix, drawScene, enableDepthTest, setViewport } from "./draw-scene.js";
import { ATCMap } from "./map.js";
import { PlaneList, EARTH_RADIUS_NAUTICAL_MILES, FEET_TO_NAUTICAL_MILES } from "./planes.js";




const BACKGROUND_COLOR = [0.0, 0.0, 0.0, 1.0]; // RGBA color for the background


const RADAR_CIRCLE_RADIUS = 20; // Circle radius in nautical miles
const RADAR_CIRCLE_NUM_POINTS = 100; // Number of points in the circle
const RADAR_CIRCLE_LINE_THICKNESS = 2; // Circle line thickness in pixels
const RADAR_CIRCLE_COLOR = [0.0, 1.0, 0.0, 1.0]; // RGBA color for the circle

const REMOVE_OUT_OF_BOUNDS_PLANES = true; // Remove planes that are out of bounds

const PLANE_CIRCLE_RADIUS = 3; // Circle radius in nautical miles
const PLANE_CIRCLE_NUM_POINTS = 100; // Number of points in the circle
const PLANE_CIRCLE_LINE_THICKNESS = 2; // Circle line thickness in pixels
const PLANE_CIRCLE_COLOR = [0.0, 1.0, 0.0, 1.0]; // RGBA color for the circle
const PLANE_TRIANGLE_SCALE = 30; // Triangle scale in pixels
const PLANE_POINTER_SCALE = 1; // Pointer scale in pixels

const PLANE_TEXT_FONT_SIZE = 10; // Font size in pixels
const PLANE_TEXT_COLOR ="rgba(0, 255, 0, 1)"; // Text color
const PLANE_TEXT_FONT_FACE = "Arial"; // Font face
const PLANE_TEXT_OFFSET_X = 10; // X offset in pixels
const PLANE_TEXT_OFFSET_Y = 10; // Y offset in pixels

const MIN_LAT = 55.55;
const MAX_LAT = 56.21;
const MIN_LON = -5.0;

const MAX_PLANES = 100; // Maximum number of planes to display
const N_HISTORY_POINTS = 15; // Number of history points to keep for each plane
const HISTORY_DOT_SEPARATION = 1; // in nautical miles
const HISTORY_DOT_START_RADIUS = 3; // in pixels
const HISTORY_DOT_N_POINTS = 10; // Number of points in the history dot circle
let deltaTime = 0.0;

let map = new ATCMap(0, 0, 0, 0, 0, 0); // Initialize the map with default values
let planes = new PlaneList(MAX_PLANES, N_HISTORY_POINTS, HISTORY_DOT_SEPARATION, REMOVE_OUT_OF_BOUNDS_PLANES); // Initialize the plane list with a maximum of 100 planes

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var mouseDownX = 0;
var mouseDownY = 0;


main();

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    // Create the shader program
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }
  
    return shaderProgram;
  }
  
  //
  // creates a shader of the given type, uploads the source and
  // compiles it.
  //
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
  
    gl.shaderSource(shader, source);
  
    // Compile the shader program
  
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
      );
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  }

  function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;
   
    if (needResize) {
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
   
    return needResize;
  }

  function drawRadarCircle(gl, programInfo, buffers, radiusNM, color) {
    //circle is 3nm, scale to radar circle radius
    let radarCircle = programInfo.shapes.radarCircle;
    let scale = 1;
    let centre = { x: map.widthPx / 2, y: map.heightPx / 2 };
    let matrix = createMatrix(gl, 0, centre.x, centre.y, scale, scale);
    drawScene(gl, programInfo, buffers, radarCircle.indicesStartIndex, radarCircle.indices.length, matrix, color);
  }

  function drawPlane(gl, programInfo, buffers, planeList, matrix, index, color) {

    planeList.updatePlane(index, deltaTime); // update plane locations

    
    let plane = planeList.getPlaneByIndex(index);

    if (plane === undefined || plane === null) {
      console.log("Plane is undefined or null");
      return;
    }
    let planePosition = map.latLonToXY(plane.latitude, plane.longitude);

    let circleColor = color;

    let mouseLatLon = map.xyToLatLon(mouseX, mouseY);

    let distance = map.calculateDistance(mouseLatLon.lat, mouseLatLon.lon, plane.latitude, plane.longitude);
    //console.log("plane  x/y: " + planePosition.x + " " + planePosition.y + " \nMouse x/y: " + mouseX + " " + mouseY);
    //console.log("Distance: " + distance);

    let mouseOverScale = 1.0;
    if (distance < PLANE_CIRCLE_RADIUS) {
      circleColor = [1.0, 0.0, 0.0, 1.0]; // red
      mouseOverScale = 1.5;
    }
    let planeHeading = plane.heading;
    matrix = createMatrix(gl,planeHeading, planePosition.x, planePosition.y, 1, 1);
    //circlePoints = map.generateCentreCirclePoints(circleRadiusPx, circleNumPoints, circleLineThicknessPx);
    //trianglePoints = map.generateCentreTrianglePoints(5);

    let circle = programInfo.shapes.circle;
    let triangle = programInfo.shapes.triangle;
    let nElements = circle.indices.length + triangle.indices.length;
    drawScene(gl, programInfo, buffers, circle.indicesStartIndex, nElements, matrix, circleColor);

    let pointer = programInfo.shapes.pointer;
    matrix = createMatrix(gl,planeHeading, planePosition.x, planePosition.y, 1, plane.speed*0.07*mouseOverScale);
    drawScene(gl, programInfo, buffers, pointer.indicesStartIndex, pointer.indices.length, matrix, color);

    let dots = programInfo.shapes.dots;

    for (let historyIndex = 0; historyIndex < plane.positionHistory.length; historyIndex++) {
      let historyPoint = plane.positionHistory.getPosition(historyIndex);
      let distance = plane.positionHistory.calculateDistance(historyPoint.latitude, historyPoint.longitude, plane.latitude, plane.longitude);
      let scale = 1 - (distance / (planeList.historyDistance*planeList.maxHistory));
      let historyPosition = map.latLonToXY(historyPoint.latitude, historyPoint.longitude);
      let historyMatrix = createMatrix(gl, planeHeading, historyPosition.x, historyPosition.y, scale, scale);
      drawScene(gl, programInfo, buffers, dots.indicesStartIndex, dots.indices.length, historyMatrix, color);
    }
  }

  function drawPlaneText(textContext, plane) {
    const planePosition = map.latLonToXY(plane.latitude, plane.longitude);
    const anchorX = planePosition.x + PLANE_TEXT_OFFSET_X;
    const anchorY = planePosition.y + PLANE_TEXT_OFFSET_Y;
    textContext.font = `${PLANE_TEXT_FONT_SIZE}px ${PLANE_TEXT_FONT_FACE}`;
    textContext.fillStyle = PLANE_TEXT_COLOR;
    textContext.fillText(plane.flightNumber, anchorX,anchorY);
    textContext.fillText(plane.type, anchorX, anchorY + PLANE_TEXT_FONT_SIZE);
    let speedText = Math.round(plane.speed) + "KTS";
    if (Math.abs(plane.speed - plane.targetSpeed) > 0.1) {
      speedText += "=>" + Math.round(plane.targetSpeed) + "KTS";
    }
    textContext.fillText(speedText, anchorX, anchorY + PLANE_TEXT_FONT_SIZE*2);


    const flightLevel = Math.round(plane.altitude / 100);
    let flightLevelText = "FL" + flightLevel.toFixed(0);
    const targetFlightLevel = Math.round(plane.targetAltitude / 100);
    if (flightLevel != targetFlightLevel) {
      flightLevelText += "=>" + targetFlightLevel + " ()";
      flightLevelText += Math.round(plane.verticalSpeed) + "FPM)";
    }
    textContext.fillText(flightLevelText, anchorX, anchorY + PLANE_TEXT_FONT_SIZE*3);

    const heading = Math.round(plane.heading);
    let headingText = heading + "\u{00b0}";
    const targetHeading = Math.round(plane.targetHeading);
    if (heading != targetHeading) {
      headingText += "=>" + targetHeading + "\u{00b0}";
    }
    textContext.fillText(headingText, anchorX, anchorY + PLANE_TEXT_FONT_SIZE*5);

    
  }



async function main() {
  const canvas = document.querySelector('#canvas');
  const textCanvas = document.querySelector('#text-canvas');

  var pause = false;

  textCanvas.onclick = function() {
    pause = !pause;
    if (pause) {
      textCanvas.style.cursor = "pointer";
      textCanvas.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
    } else {
      textCanvas.style.cursor = "default";
      textCanvas.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    }
  }

  resizeCanvasToDisplaySize(canvas);
  const gl = canvas.getContext('webgl2');
  const textContext = textCanvas.getContext('2d');

  document.querySelector("#text-canvas").addEventListener("mousemove", (e) => {
    document.querySelector("#mouse").innerText = `x:${e.clientX}, y:${e.clientY}`;
    mouseX =  e.clientX;
    mouseY =  e.clientY;

}
);

  map.widthPx = canvas.clientWidth;
  map.heightPx = canvas.clientHeight;

  const aspect = map.widthPx / map.heightPx;
  
  map.minLat = MIN_LAT;
  map.maxLat = MAX_LAT;
  map.minLon = MIN_LON;


  const midLat = (map.minLat + map.maxLat) / 2;

  

  const mapHeightNM = map.calculateDistance(map.minLat, map.minLon, map.maxLat, map.minLon);

  const mapWidthNM = aspect * mapHeightNM;

  const rightMidPoint = map.calculatePoint(midLat, map.minLon, mapWidthNM, 90);
  map.maxLon = rightMidPoint.lon;

  const midLon = (map.minLon + map.maxLon) / 2;

  console.log("mapWidthNM: " + mapWidthNM);
  console.log("mapHeightNM: " + mapHeightNM);
  console.log("pixel aspect: " + aspect);
  console.log("Nautical miles aspect: " + mapWidthNM / mapHeightNM);
  console.log("minLat: " + map.minLat);
  console.log("maxLat: " + map.maxLat);
  console.log("minLon: " + map.minLon);
  console.log("maxLon: " + map.maxLon);
  planes.setBounds(midLat, midLon, RADAR_CIRCLE_RADIUS*1.1);



  let centreLat = (map.minLat + map.maxLat) / 2;
  let centreLon = (map.minLon + map.maxLon) / 2;

  let randomDirection = Math.round(Math.random() * 360);
  let randomDirection2 = Math.round(Math.random() * 360);
  let randomRadius = Math.round(Math.random() * RADAR_CIRCLE_RADIUS);
  let randomRadius2 = Math.round(Math.random() * RADAR_CIRCLE_RADIUS);


  let randomLatLon = map.calculatePoint(centreLat, centreLon, randomDirection, randomRadius);
  let randomLatLon2 = map.calculatePoint(centreLat, centreLon, randomDirection2, randomRadius2);


  let randomHeading = Math.round(Math.random() * 360);
  let randomHeading2 = Math.round(Math.random() * 360);

  let randomSpeed = Math.round(Math.random() * 900) + 100;
  let randomSpeed2 = Math.round(Math.random() * 900) + 100;

  planes.addPlane("BAW123", "Boeing 737", "1234", randomLatLon.lat, randomLatLon.lon, 6000, randomSpeed,randomHeading, -1000);

  planes.addPlane("BAW456", "Boeing 747", "5678", randomLatLon2.lat, randomLatLon2.lon, 10000, randomSpeed2, randomHeading2, 0);



  if (!gl) {
      alert('Failed to get the rendering context for WebGL');
      return;
  }

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);


  const vsSource = await fetch('shader.vert').then(response => response.text());
  const fsSource = await fetch('shader.frag').then(response => response.text());

  console.log(vsSource);
  console.log(fsSource);

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition")//,
        //vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      },
      uniformLocations: {
        matrix: gl.getUniformLocation(shaderProgram, "uMatrix"),
        circleColor: gl.getUniformLocation(shaderProgram, "uCircleColor"),
      },
    };

  let radarCircle = 
  {
    pointsStartIndex: 0,
    indicesStartIndex:0,
    points: [],
    indices: []
  };

  let radarCircleRadius = map.distanceNMToPixels(RADAR_CIRCLE_RADIUS);
  radarCircle.points = map.generateCirclePoints(centreLat, centreLon, radarCircleRadius, RADAR_CIRCLE_NUM_POINTS, RADAR_CIRCLE_LINE_THICKNESS);
  radarCircle.indices = map.generateCircleIndices(radarCircle.points, 0);


  let circle = {
    pointsStartIndex: radarCircle.points.length/2, 
    indicesStartIndex: radarCircle.indices.length,
    points: [],
    indices: [],
  };

  const planeCircleRadiusPx = map.distanceNMToPixels(PLANE_CIRCLE_RADIUS);
  circle.points = map.generateCentreCirclePoints(planeCircleRadiusPx, PLANE_CIRCLE_NUM_POINTS, PLANE_CIRCLE_LINE_THICKNESS);
  
  
  circle.indices = map.generateCircleIndices(circle.points, circle.pointsStartIndex);

  let triangle = {
    pointsStartIndex: circle.pointsStartIndex + circle.points.length/2, 
    indicesStartIndex: circle.indicesStartIndex + circle.indices.length,
    points: [],
    indices: [],
  };
  triangle.points = map.generateCentreTrianglePoints(PLANE_TRIANGLE_SCALE);

  triangle.indices = map.generatePlaneTriangleIndices(triangle.pointsStartIndex);

  let pointer = {
    pointsStartIndex: triangle.pointsStartIndex + triangle.points.length/2, 
    indicesStartIndex: triangle.indicesStartIndex + triangle.indices.length,
    points: [],
    indices: [],
  }
  let pointerGen = map.generatePlanePointer(PLANE_POINTER_SCALE, pointer.pointsStartIndex);
  pointer.points = pointerGen.points;
  pointer.indices = pointerGen.indices;

  let dots = {
    pointsStartIndex: pointer.pointsStartIndex + pointer.points.length/2,
    indicesStartIndex: pointer.indicesStartIndex + pointer.indices.length,
    points: [],
    indices: [],
  };
  let dotsGen = map.generateFilledCircle(HISTORY_DOT_START_RADIUS, HISTORY_DOT_N_POINTS, dots.pointsStartIndex);
  dots.points = dotsGen.points;
  dots.indices = dotsGen.indices;



  // let nElements = circleIndices.length + triangleIndices.length;
  // let nDotsElements = dots.indices.length;

  programInfo.shapes = {
    radarCircle: radarCircle,
    circle: circle,
    triangle: triangle,
    pointer: pointer,
    dots: dots
  };


  clearErrorQueue(gl, true);

  const buffers = initBuffers(gl, programInfo);
  checkError(gl, "Error initializing buffers", true);

  bufferPointsData(gl, buffers, programInfo.shapes);
  checkError(gl, "Error buffering points data", true);
  bufferIndicesData(gl, buffers, programInfo.shapes);
  checkError(gl, "Error buffering indices data", true);


  let then = 0;

  let matrix = createMatrix(gl, 0, 0, 0, 0, 0);
  let color = PLANE_CIRCLE_COLOR;

  planes.setTargetFlightLevel(0, 30);
  planes.setTargetHeading(0, 90);
  planes.setTargetSpeed(0, 500);

  planes.setTargetFlightLevel(1, 40);
  planes.setTargetHeading(1, 125);
  planes.setTargetSpeed(1, 200);

  function render(now) {
    resizeCanvasToDisplaySize(canvas);
    resizeCanvasToDisplaySize(textCanvas);

    now *= 0.001; // convert to seconds
    
    deltaTime = now - then;
    then = now;

    if (pause) {
      requestAnimationFrame(render);
      return;
    }

    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height);

    clearCanvas(gl);
    setViewport(gl);

    enableDepthTest(gl);

    drawRadarCircle(gl, programInfo, buffers, RADAR_CIRCLE_RADIUS, RADAR_CIRCLE_COLOR);
    
    for (let i = 0; i < planes.nPlanes; i++) {
      drawPlaneText(textContext, planes.getPlaneByIndex(i));
      drawPlane(gl, programInfo, buffers, planes, matrix, i, color);
    }

    if (now < 55) {
      requestAnimationFrame(render);
    }
  }
    requestAnimationFrame(render);

}


