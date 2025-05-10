import * as glFuncs from './glFunctions.js';
//import * as glMatrix from './gl-matrix-min.js';






export function updateBuffers(gl, buffers, circlePoints, trianglePoints, circleIndices, triangleIndices) {
  bufferCirclePoints(gl, buffers, circlePoints);
  bufferCircleIndices(gl, buffers, circleIndices);
  bufferTrianglePoints(gl, buffers, trianglePoints, circlePoints.length);
  bufferTriangleIndices(gl, buffers, triangleIndices, circlePoints.length / 2, circleIndices.length);
}




function drawScene(gl, programInfo, buffers, firstElementIndex, nElements, matrix, color, zLayer=0) {

  glFuncs.clearErrorQueue(gl, false);
    // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  glFuncs.checkError(gl, "Error using program", true);


  glFuncs.setMatrix(gl, programInfo, matrix);
  glFuncs.checkError(gl, "Error setting matrix", true);
  gl.uniform4fv(programInfo.uniformLocations.circleColor, color);
  glFuncs.checkError(gl, "Error setting circle color", true);

    //setElementBuffer(gl, buffers);
    
    //gl.bindVertexArray(buffers.vao);
  setPositionAttribute(gl, buffers, programInfo);
  gl.bindVertexArray(buffers.vao);
  glFuncs.checkError(gl, "Error binding VAO", true);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  glFuncs.checkError(gl, "Error binding index buffer", true);
    //console.log("circleColor: " + gl.getUniform(programInfo.program, programInfo.uniformLocations.circleColor));

    {
      const offset = firstElementIndex * Uint16Array.BYTES_PER_ELEMENT;
      gl.drawElements(gl.TRIANGLES, nElements, gl.UNSIGNED_SHORT, offset);
      if (glFuncs.checkError(gl, "Error drawing elements", true)) {
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
    glFuncs.checkError(gl, "Error binding position buffer", true);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    glFuncs.checkError(gl, "Error setting vertex attribute pointer", true);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    glFuncs.checkError(gl, "Error enabling vertex attribute array", true);
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