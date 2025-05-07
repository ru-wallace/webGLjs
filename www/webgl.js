import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { ATCMap } from "./map.js";
import { PlaneList, EARTH_RADIUS_NAUTICAL_MILES, FEET_TO_NAUTICAL_MILES } from "./planes.js";

let squareRotation = 0.0;
let deltaTime = 0.0;

let map = new ATCMap(0, 0, 0, 0, 0, 0); // Initialize the map with default values
let planes = new PlaneList(100); // Initialize the plane list with a maximum of 100 planes


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



async function main() {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl2');

    map.widthPx = canvas.clientWidth;
    map.heightPx = canvas.clientHeight;
    map.minLat = 55.7070;
    map.maxLat = 55.9434;
    map.minLon = -4.6774;
    map.maxLon = -4.1494;

    planes.addPlane("BAW123", "Boeing 737", "1234", 55.8, -4.5, 30000, 500, 90, 0);

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

    let circleRadiusPx = 200;
    let circleLineThicknessPx = 10;
    let circleNumPoints = 100;
    let circlePoints = map.generateCirclePoints(planes.latitudes[0], planes.longitudes[0], circleRadiusPx, circleNumPoints, circleLineThicknessPx);
    console.log(circlePoints);

    
    let circleIndices = map.generateCircleTriangleIndices(circlePoints);
    console.log(circleIndices);
  
    for (let i = 0; i < circleIndices.length; i++) {
      if (i %3 == 0) {
        console.log("Triangle: " + circleIndices[i] + ", " + circleIndices[i+1] + ", " + circleIndices[i+2]);
    }
        console.log(i + ": " + circleIndices[i] + " (" + circlePoints[circleIndices[i] * 2] + ", " + circlePoints[circleIndices[i] * 2 + 1] + ")");

    }

    let nElements = circleIndices.length;
    const buffers = initBuffers(gl, programInfo, circlePoints, circleIndices);
    // const positions = [
    //   900, 800, 
    //   100, 900,
    //    900, 100, 
    //    100, 100
    //   ];
    // const indices = [0, 1, 2, 1, 2, 3];
    // const nElements = indices.length;
    // const buffers = initBuffers(gl, programInfo, positions, indices);
    

    let then = 0;

    // Draw the scene repeatedly
    function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    planes.updateLocation(0, deltaTime); // update plane locations
    circlePoints = map.generateCirclePoints(planes.latitudes[0], planes.longitudes[0], circleRadiusPx, circleNumPoints, circleLineThicknessPx);
    bufferData(gl, buffers.position, circlePoints);
    
    drawScene(gl, programInfo, buffers, nElements);
    console.log(planes.getPlaneByIndex(0));
    squareRotation += deltaTime;

    requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

function bufferData(gl, buffer, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
}
