import { createMatrix, replaceMatrix } from "./matrixFunctions.js";
import * as geom from "./geometryFunctions.js";
import * as convert from "./conversions.js";

export function clearErrorQueue(gl, print = false) {
  if (print) {
    console.log("Clearing error queue...");
  }
  while (true) {
    if (!checkError(gl, "Error in queue", print)) {
      break;
    }
  }
}

export function checkError(gl, message, print=true) {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    if (print) {
      console.log(message + ": " + error.toString(16));
    }
    
  }
  return error !== gl.NO_ERROR;
}


export function enableDepthTest(gl) {
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
}
export function setViewport(gl) {
  gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
}

export function clearCanvas(gl, clearColor=[0.0, 0.0, 0.0, 1.0], clearDepth=1.0) {
  gl.clearColor(...clearColor); // Clear to clearColor, default is black
  gl.clearDepth(1.0); // Clear everything
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


export function setMatrix(gl, program, location, uMatrix) {

  gl.useProgram(program);
  gl.uniformMatrix3fv(
    location,
    false,
    uMatrix,
  );

}

export function initVAO(gl) {
  const vao = gl.createVertexArray();

  return vao;
}


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

function getUniformLocation(gl, program, name) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    console.error(`Failed to get uniform location for ${name}`);
  }
  return location;
}
function getAttribLocation(gl, program, name) {
  const location = gl.getAttribLocation(program, name);
  if (location === -1) {
    console.error(`Failed to get attribute location for ${name}`);
  }
  return location;
}

export class GLInstance {
  constructor(gl, vsSource, fsSource, shapes, map ) {

    this.program = initShaderProgram(gl, vsSource, fsSource);

    this.uniformLocations = {
      uMatrix: getUniformLocation(gl, this.program, "uMatrix"),
      uColor: getUniformLocation(gl, this.program, "uColor"),
      uZLayer: getUniformLocation(gl, this.program, "uZLayer"),
    };

    this.attribLocations = {
      position: getAttribLocation(gl, this.program, "aVertexPosition"),
    };

    console.log("Uniform locations: ", this.uniformLocations);
    console.log("Attribute locations: ", this.attribLocations);
    this.shapes = shapes;
    this.map = map;
    this.gl = gl;
    this.matrix = createMatrix(gl, 0, 0, 0, 1, 1);

    this.buffers = {
      position: this.initPositionBuffer(),
    }

    this.vaos = {};
    var nPoints = 0;

    for (const shape in this.shapes) {
      if (shape === "points" || shape === "indices") {
        continue;
      }
      console.log("Shape: " + shape);
      console.log("Shape points: " + this.shapes[shape].nPoints);
      console.log("Shape indices: " + this.shapes[shape].indices.length);
      const vao = this.createVAO(this.shapes[shape].indices, nPoints + this.shapes[shape].zeroIndex);
      this.shapes[shape].vao = vao;
      nPoints += this.shapes[shape].nPoints;

    }

    this.bufferPointsData();

    // this.buffers.index = this.initIndexBuffer();

    // this.setPositionAttribute();
    // this.bindElementBuffer();
    // this.bufferIndicesData();

    this.setViewport();

    this.clearColor = [0.0, 0.0, 0.0, 1.0];
    this.clearDepth = 1.0;
    

  }

  setViewport() {
    setViewport(this.gl);
  }
  enableDepthTest() {
    enableDepthTest(this.gl);
  }

  setMatrix(uMatrix) {
    setMatrix(this.gl, this.program, this.uniformLocations.uMatrix, uMatrix);
  }
  updateMatrix(heading, x, y, scaleX, scaleY, offsetX=0, offsetY=0) {
    replaceMatrix(this.gl, this.matrix, heading, x, y, scaleX, scaleY, offsetX, offsetY);
    setMatrix(this.gl, this.program, this.uniformLocations.uMatrix, this.matrix);
  }

  generateVAO() {
    this.vao = initVAO(this.gl);
  }

  bindVao() {
    this.gl.bindVertexArray(this.vao);
  }

  setColor(color) {
    this.gl.uniform4fv(this.uniformLocations.uColor, color);
  }

  setZLayer(zLayer) {
    this.gl.uniform1f(this.uniformLocations.uZLayer, zLayer);
  }

  initPositionBuffer() {
    this.clearErrorQueue(true);
    // Create a buffer for the square's positions.
    const positionBuffer = this.gl.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.checkError("Error binding position buffer");
    return positionBuffer;
  }
  initIndexBuffer() {
    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    return indexBuffer;
  }

  setPositionAttribute() {
    const numComponents = 2; // pull out 2 values per iteration
    const type = this.gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from

    this.bindPositionBuffer();
    this.gl.vertexAttribPointer(
      this.attribLocations.position,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    this.gl.enableVertexAttribArray(this.attribLocations.position);
  }
  bindElementBuffer() {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
  }
  bindPositionBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
  }
  clearErrorQueue(print=true) {
    clearErrorQueue(this.gl, print);
  }
  checkError(message, print=true) {
    return checkError(this.gl, message, print);
  }

  clearCanvas(clearColor = null, clearDepth = null) {
    var color = this.clearColor;
    var depth = this.clearDepth;
    if (clearColor !== null) {
      color = clearColor;
    }
    if (clearDepth !== null) {
      depth = clearDepth;
    }
    clearCanvas(this.gl, color, depth);
  }

  drawScene(firstElementIndex, nElements, matrix, color, zLayer = 0) {
    
    // console.log("Drawing scene: firstElementIndex: " + firstElementIndex + " nElements: " + nElements);
    // console.log("Matrix: " + matrix);
    // console.log("Color: " + color);
    // console.log("ZLayer: " + zLayer);
    this.gl.useProgram(this.program);
    this.setMatrix(matrix);
    this.setColor(color);
    this.setPositionAttribute();
    this.gl.bindVertexArray(this.vao);
    this.bindElementBuffer();
    //this.bindPositionBuffer();
    this.setZLayer(zLayer);
    this.gl.drawElements(this.gl.TRIANGLES, nElements, this.gl.UNSIGNED_SHORT, firstElementIndex * Uint16Array.BYTES_PER_ELEMENT);
  }

  drawCircle(plane, color) {
    //console.log("Drawing plane circle");
    const planeLocation = this.map.latLonToXY(plane.latitude, plane.longitude);
    this.updateMatrix(plane.heading, planeLocation.x, planeLocation.y, 0.5, 0.5);
    this.drawShape(this.shapes.circle, color, 0);
    //this.drawScene(this.shapes.circle.elementStartIndex, this.shapes.circle.nIndices, matrix, color, 0);
  }

  drawArrow(plane, color) {
    //console.log("Drawing plane triangle");
    const planeLocation = this.map.latLonToXY(plane.latitude, plane.longitude);
    this.updateMatrix(plane.heading, planeLocation.x, planeLocation.y, 1.0, 1.0);
    // this.drawScene(this.shapes.arrow.elementStartIndex, this.shapes.arrow.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.arrow, color, 0);
  }

  drawTargetIndicator(plane, color) {

    const planeLocation = this.map.latLonToXY(plane.latitude, plane.longitude);
    this.updateMatrix(plane.targetHeading, planeLocation.x, planeLocation.y, 1.5, plane.targetSpeed / 20, 0, -1);
    //this.drawScene(this.shapes.rectangle.elementStartIndex, this.shapes.rectangle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.rectangle, color, 0);

  }
  drawPlaneSpeedIndicator(plane, color) {
    //console.log("Drawing plane pointer");

    const planeLocation = this.map.latLonToXY(plane.latitude, plane.longitude);
    this.updateMatrix(plane.heading, planeLocation.x, planeLocation.y, 1.5, plane.speed / 20, 0, -1);
    //this.drawScene(this.shapes.rectangle.elementStartIndex, this.shapes.rectangle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.rectangle, color, 0);

  }



  drawPlane(plane, drawTarget, circleColor, arrowColor, speedIndicatorColor, targetIndicatorColor) {

    if (arrowColor === undefined) {
      arrowColor = circleColor;
    }
    if (speedIndicatorColor === undefined) {
      speedIndicatorColor = circleColor;
    }
    if (targetIndicatorColor === undefined) {
      targetIndicatorColor = speedIndicatorColor;
    }

    if (drawTarget && (plane.speed != plane.targetSpeed || plane.heading != plane.targetHeading)) {
      this.drawTargetIndicator(plane, targetIndicatorColor);
    }
    this.drawPlaneSpeedIndicator(plane, speedIndicatorColor);
    
    this.drawCircle(plane, circleColor);
    this.drawArrow(plane, arrowColor);
    
  }
  drawHistoryPoint(plane, historyIndex, color, scale) {
    //console.log("Drawing history point: " + historyIndex);
    let historyPoint = plane.positionHistory.getPosition(historyIndex);
    //console.log("History point: " + historyPoint.latitude + ", " + historyPoint.longitude);
    //console.log("scale: " + scale);
    let historyPosition = this.map.latLonToXY(historyPoint.latitude, historyPoint.longitude);
    this.updateMatrix(plane.heading, historyPosition.x, historyPosition.y, scale, scale);
    // this.drawScene(this.shapes.filledCircle.elementStartIndex, this.shapes.filledCircle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.filledCircle, color, 0);
  }

  drawRadarCircle(color) {
    this.updateMatrix(0, this.map.widthPx / 2, this.map.heightPx / 2, 1.0, 1.0);
    //this.drawScene(this.shapes.radarCircle.elementStartIndex, this.shapes.radarCircle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.radarCircle, color, 0);
  }

  drawVorSymbol(lat, lon, color) {
    const vorLocation = this.map.latLonToXY(lat, lon);
    
    this.updateMatrix(0, vorLocation.x, vorLocation.y, 1.0, 1.0);
    this.drawShape(this.shapes.vorSymbol, color, 0);
    //this.drawScene(this.shapes.vorSymbol.elementStartIndex, this.shapes.vorSymbol.nIndices, matrix, color, 0);
  }

  drawRunway(runway, color) {
    

    const runwayLocation = this.map.latLonToXY(runway.latitude, runway.longitude);

    const runwayScale = this.map.distanceMetresToPixels(runway.length);
    const runwayWidthScale = Math.max(this.map.distanceMetresToPixels(runway.width), 2);

    this.updateMatrix(runway.bearing+90, runwayLocation.x, runwayLocation.y, runwayScale, runwayWidthScale);
    //this.drawScene(this.shapes.rectangle.elementStartIndex, this.shapes.rectangle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.rectangle, color, 0);
  }


  drawIdbSymbol(lat, lon, color) {
    const idbLocation = this.map.latLonToXY(lat, lon);

    const nIncrements = 12;
    const increment = 2 * Math.PI / nIncrements;
    const innerDotRadius = 1;
    const innerRingRadius = 0.1;
    var ringWidth = 0.2;
    const outerDotsRadius = 1;
    const nOuterRings = 5;

    this.updateMatrix(0, idbLocation.x, idbLocation.y, innerDotRadius, innerDotRadius);
    //this.drawScene(this.shapes.filledCircle.elementStartIndex, this.shapes.filledCircle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.filledCircle,color, 0);
    this.updateMatrix(0, idbLocation.x, idbLocation.y, innerRingRadius, innerRingRadius);
    this.drawShape(this.shapes.circle,  color, 0);
    //this.drawScene(this.shapes.circle.elementStartIndex, this.shapes.circle.nIndices, matrix, color, 0);
    

    for (let i = 0; i < nOuterRings; i++) {
      for (let j = 0; j < nIncrements; j++) {
        const angle = j * increment;
        const x = Math.cos(angle) *  i * ringWidth;
        const y = Math.sin(angle) *  i * ringWidth;
        this.updateMatrix(0, idbLocation.x + x, idbLocation.y - y, outerDotsRadius, outerDotsRadius);
        //this.drawScene(this.shapes.filledCircle.elementStartIndex, this.shapes.filledCircle.nIndices, matrix, color, 0);
        this.drawShape(this.shapes.filledCircle, color, 0);
      }
      ringWidth = ringWidth + 0.6;
    }
  }

  drawIlsApproachAltitudePoint(bearing, thresholdLat, thresholdLon, glideSlope, altitudeFt, color) {

    const altMetres = convert.feetToMetres(altitudeFt);
    const distance = altMetres / Math.tan(glideSlope * Math.PI / 180);
    const pointLocation = geom.calculateDestination(thresholdLat, thresholdLon, distance, bearing);
    const ilsLocation = this.map.latLonToXY(pointLocation.lat, pointLocation.lon);
    this.updateMatrix(bearing + 45, ilsLocation.x, ilsLocation.y, 2, 5);
    //this.drawScene(this.shapes.rectangle.elementStartIndex, this.shapes.rectangle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.rectangle, color, 0);
    this.updateMatrix(bearing + 135, ilsLocation.x, ilsLocation.y, 2, 5);
    //this.drawScene(this.shapes.rectangle.elementStartIndex, this.shapes.rectangle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.rectangle, color, 0);
  }

  drawIlsApproach(runway, color) {
    var approach;
    for (let i = 0; i < runway.approaches.length; i++) {

      if (runway.activeApproach === runway.approaches[i].runway) {
        approach = runway.approaches[i];

      }
    }
    const ilsLocationLatLon = geom.calculateDestination(runway.latitude, runway.longitude, runway.length / 2, approach.bearing + 180);
    const ilsLocation = this.map.latLonToXY(ilsLocationLatLon.lat, ilsLocationLatLon.lon);
    const bearing = approach.bearing + 180;
    const length = this.map.distanceMetresToPixels(approach.length);
    const glideSlope = approach.glideslope;


    this.drawIlsApproachAltitudePoint(bearing, ilsLocationLatLon.lat, ilsLocationLatLon.lon, glideSlope, 1000, color);
    this.drawIlsApproachAltitudePoint(bearing, ilsLocationLatLon.lat, ilsLocationLatLon.lon, glideSlope, 2000, color);
    this.drawIlsApproachAltitudePoint(bearing, ilsLocationLatLon.lat, ilsLocationLatLon.lon, glideSlope, 3000, color);
  
    this.updateMatrix(bearing, ilsLocation.x, ilsLocation.y, 1.0, length, 0, -1);
    //this.drawScene(this.shapes.rectangle.elementStartIndex, this.shapes.rectangle.nIndices, matrix, color, 0);
    this.drawShape(this.shapes.rectangle, color, 0);

  }

  drawShape(shape, color, zLayer=0.0) {
    this.gl.useProgram(this.program);
    this.setColor(color);
    this.setZLayer(zLayer);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    //this.setMatrix(matrix);
    this.gl.bindVertexArray(shape.vao);

   // this.gl.drawElements(this.gl.TRIANGLES, nElements, this.gl.UNSIGNED_SHORT, firstElementIndex * Uint16Array.BYTES_PER_ELEMENT);
    this.gl.drawElements(this.gl.TRIANGLES, shape.nIndices, this.gl.UNSIGNED_SHORT, shape.elementStartIndex * Uint16Array.BYTES_PER_ELEMENT);
    this.gl.bindVertexArray(null);
  }

  bufferPointsData() {
    this.clearErrorQueue();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.shapes.points), this.gl.STATIC_DRAW);
    this.checkError("Error buffering points data");
    console.log("Buffered points data: nPoints: " + this.shapes.points.length);
  }
  
  bufferIndicesData() { 
    this.bindVao();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.shapes.indices), this.gl.STATIC_DRAW);
    console.log("Buffered indices data: nIndices: " + this.shapes.indices.length);
  }



  createVAO(indexArray, startOffset) {

    const offset = startOffset  * Float32Array.BYTES_PER_ELEMENT;
    //this.shapes.points.push(...vertexArray);
    //this.shapes.points.push(...vertexArray);
    this.clearErrorQueue();
    const vao = this.gl.createVertexArray();  

    this.gl.bindVertexArray(vao);

    this.gl.enableVertexAttribArray(this.attribLocations.position);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);

    this.gl.vertexAttribPointer(
      this.attribLocations.position, 
      2, // numComponents
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      offset, // offset
    );

    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), this.gl.STATIC_DRAW);
    //this.gl.bindVertexArray(0);

    return vao;

  }
  
}