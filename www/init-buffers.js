function initBuffers(gl, programInfo, circlePoints, circleIndices) {

  const positionBuffer = initPositionBuffer(gl, circlePoints);
  //const vao = initVAO(gl);
  //setupVertexAttribPointer(gl, programInfo, positionBuffer, programInfo.attribLocations.vertexPosition, 2);
  const indexBuffer = initIndexBuffer(gl, circleIndices);
  //const colorBuffer = initColorBuffer(gl);
  return {
    position: positionBuffer,//vbo
    index: indexBuffer,//ebo
   // vao: vao,//vao
    //color: colorBuffer,
  };
}

function initVAO(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  return vao;
}

function setupVertexAttribPointer(gl, programInfo, buffers) {
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
}
  
function initPositionBuffer(gl, circlePoints) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();
  
  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = circlePoints;
  console.log("positions");
  console.log(new Float32Array(positions));
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}
  
export { initBuffers };

function initIndexBuffer(gl, circleIndices) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
    return indexBuffer;
}

function initColorBuffer(gl) {
  const colors = [
    1.0,
    1.0,
    1.0,
    1.0, // white
    1.0,
    0.0,
    0.0,
    1.0, // red
    0.0,
    1.0,
    0.0,
    1.0, // green
    0.0,
    0.0,
    1.0,
    1.0, // blue
  ];

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

  
  