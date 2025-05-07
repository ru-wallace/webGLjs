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

export function createMatrix(gl) {
  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const uMatrix = mat3.create();
  mat3.projection(uMatrix, gl.canvas.clientWidth, gl.canvas.clientHeight);
  mat3.translate(uMatrix, uMatrix, [0, 0]); 
  mat3.scale(uMatrix, uMatrix, [1, 1]);
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

export function bufferPointsData(gl, buffers, circlePoints, trianglePoints) {
  let combinedPoints = circlePoints.concat(trianglePoints);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(combinedPoints), gl.DYNAMIC_DRAW);
}

export function bufferIndicesData(gl, buffers, circleIndices, triangleIndices) { 
  let maxIndex = Math.max(...circleIndices);
  let combinedIndices = circleIndices.concat(triangleIndices.map(index => index + maxIndex));
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



export function bufferTrianglePoints(gl, buffers, trianglePoints, circlePoints) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferSubData(gl.ARRAY_BUFFER, circlePoints.length * Float32Array.BYTES_PER_ELEMENT, new Float32Array(trianglePoints));
}

export function bufferTriangleIndices(gl, buffers, triangleIndices, circleIndices) {
  gl.bindVertexArray(buffers.vao);
  let maxIndex = Math.max(...circleIndices);
  let triangleIndicesAdjusted = triangleIndices.map(index => index + maxIndex+1);
  console.log("triangleIndices: " + triangleIndicesAdjusted);

  

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, circleIndices.length * Uint16Array.BYTES_PER_ELEMENT, new Uint16Array(triangleIndicesAdjusted));
}

export function updateBuffers(gl, buffers, circlePoints, trianglePoints, circleIndices, triangleIndices) {
  bufferCirclePoints(gl, buffers, circlePoints);
  bufferCircleIndices(gl, buffers, circleIndices);
  bufferTrianglePoints(gl, buffers, trianglePoints, circlePoints);
  bufferTriangleIndices(gl, buffers, triangleIndices, circleIndices);
}




function drawScene(gl, programInfo, buffers, nElements, circlePoints, trianglePoints, matrix, circleColor) {
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    // gl.clearDepth(1.0); // Clear everything
    // gl.enable(gl.DEPTH_TEST); // Enable depth testing
    // gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  
    // // Clear the canvas before we start drawing on it.
  
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.


    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);


  bufferCirclePoints(gl, buffers, circlePoints);
  bufferTrianglePoints(gl, buffers, trianglePoints, circlePoints);
  // Set the shader uniforms
  setMatrix(gl, programInfo, matrix);

  gl.uniform4fv(programInfo.uniformLocations.circleColor, circleColor);


    //setElementBuffer(gl, buffers);
    
    //gl.bindVertexArray(buffers.vao);
  setPositionAttribute(gl, buffers, programInfo);
  gl.bindVertexArray(buffers.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

    //console.log("circleColor: " + gl.getUniform(programInfo.program, programInfo.uniformLocations.circleColor));

    {
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, nElements, gl.UNSIGNED_SHORT, offset);
      let error = gl.getError();
      if (error) {
        console.error("Error drawing elements: " + error);
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
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
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