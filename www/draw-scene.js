export function clearErrorQueue(gl, print=false) {
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

export function clearCanvas(gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export function enableDepthTest(gl) {
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
}
export function setViewport(gl) {
  gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
}

export function createMatrix(gl, rotateDegrees, translateX, translateY, scaleX=1, scaleY=1) {

  const uMatrix = mat3.create();

  
  //mat3.scale(uMatrix, uMatrix, [1, 1]);
  
   // Rotate by 90 degrees to get the plane's orientation
  mat3.projection(uMatrix, gl.canvas.clientWidth, gl.canvas.clientHeight);
  
  //mat3.rotate(uMatrix, uMatrix, rotateDegrees * Math.PI / 180);

  mat3.translate(uMatrix, uMatrix, [translateX, translateY]);
  mat3.rotate(uMatrix, uMatrix, rotateDegrees * Math.PI / 180);
  if (scaleX !== 1 || scaleY !== 1) {
    mat3.scale(uMatrix, uMatrix, [scaleX, scaleY]);
  }
  mat3.translate(uMatrix, uMatrix, [-gl.canvas.clientWidth / 2, -gl.canvas.clientHeight / 2]);
 // Translate to the center of the canvas

  return uMatrix;
}
export function setMatrix(gl, programInfo, uMatrix) {

  gl.useProgram(programInfo.program);
  gl.uniformMatrix3fv(
    programInfo.uniformLocations.matrix,
    false,
    uMatrix,
  );

}

export function bufferPointsData(gl, buffers, shapes) {
  let radarCirclePoints = shapes.radarCircle.points;
  let circlePoints = shapes.circle.points;
  let trianglePoints = shapes.triangle.points;
  let pointerPoints = shapes.pointer.points;
  let dotPoints = shapes.dots.points;

  let combinedPoints = radarCirclePoints.concat(circlePoints).concat(trianglePoints).concat(pointerPoints).concat(dotPoints);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(combinedPoints), gl.DYNAMIC_DRAW);
}

export function bufferIndicesData(gl, buffers, shapes) { 
  let radarCircleIndices = shapes.radarCircle.indices;
  let circleIndices = shapes.circle.indices;
  let triangleIndices = shapes.triangle.indices;
  let pointerIndices = shapes.pointer.indices;
  let dotIndices = shapes.dots.indices;

  
  let combinedIndices = radarCircleIndices.concat(circleIndices).concat(triangleIndices).concat(pointerIndices).concat(dotIndices);
  gl.bindVertexArray(buffers.vao);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(combinedIndices), gl.DYNAMIC_DRAW);
}

export function bufferCirclePoints(gl, buffers, circlePoints) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(circlePoints));
}
export function bufferCircleIndices(gl, buffers, circleIndices) {
  gl.bindVertexArray(buffers.vao);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(circleIndices));
}



export function bufferTrianglePoints(gl, buffers, trianglePoints, nCirclePoints) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferSubData(gl.ARRAY_BUFFER, nCirclePoints * Float32Array.BYTES_PER_ELEMENT, new Float32Array(trianglePoints));
}

export function bufferTriangleIndices(gl, buffers, triangleIndices, startIndex, nCircleIndices) {
  gl.bindVertexArray(buffers.vao);
  

  console.log("triangleIndices: " + triangleIndices);

  

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, nCircleIndices * Uint16Array.BYTES_PER_ELEMENT, new Uint16Array(triangleIndicesAdjusted));
}

export function updateBuffers(gl, buffers, circlePoints, trianglePoints, circleIndices, triangleIndices) {
  bufferCirclePoints(gl, buffers, circlePoints);
  bufferCircleIndices(gl, buffers, circleIndices);
  bufferTrianglePoints(gl, buffers, trianglePoints, circlePoints.length);
  bufferTriangleIndices(gl, buffers, triangleIndices, circlePoints.length / 2, circleIndices.length);
}




function drawScene(gl, programInfo, buffers, firstElementIndex, nElements, matrix, circleColor) {

  clearErrorQueue(gl, false);
    // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  checkError(gl, "Error using program", true);


  setMatrix(gl, programInfo, matrix);
  checkError(gl, "Error setting matrix", true);
  gl.uniform4fv(programInfo.uniformLocations.circleColor, circleColor);
  checkError(gl, "Error setting circle color", true);

    //setElementBuffer(gl, buffers);
    
    //gl.bindVertexArray(buffers.vao);
  setPositionAttribute(gl, buffers, programInfo);
  gl.bindVertexArray(buffers.vao);
  checkError(gl, "Error binding VAO", true);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  checkError(gl, "Error binding index buffer", true);
    //console.log("circleColor: " + gl.getUniform(programInfo.program, programInfo.uniformLocations.circleColor));

    {
      const offset = firstElementIndex * Uint16Array.BYTES_PER_ELEMENT;
      gl.drawElements(gl.TRIANGLES, nElements, gl.UNSIGNED_SHORT, offset);
      if (checkError(gl, "Error drawing elements", true)) {
        console.log("Start index: " + firstElementIndex);
        console.log("nElements: " + nElements);
      }
      
    }
  }
  
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  function setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    checkError(gl, "Error binding position buffer", true);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    checkError(gl, "Error setting vertex attribute pointer", true);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    checkError(gl, "Error enabling vertex attribute array", true);
  }
  
 
  
  function setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

function setElementBuffer(gl, buffers) {
  gl.bindVertexArray(buffers.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  }

  export { drawScene };