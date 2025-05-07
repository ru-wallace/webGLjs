function drawScene(gl, programInfo, buffers, nElements) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  
    // Clear the canvas before we start drawing on it.
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
  
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const uMatrix = mat3.create();
    mat3.projection(uMatrix, gl.canvas.clientWidth, gl.canvas.clientHeight);
    mat3.translate(uMatrix, uMatrix, [0, 0]);
    mat3.scale(uMatrix, uMatrix, [1, 1]);



    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
  
    // Set the shader uniforms
    gl.uniformMatrix3fv(
      programInfo.uniformLocations.matrix,
      false,
      uMatrix,
    );

    gl.uniform4f(programInfo.uniformLocations.circleColor, 0.0, 1.0, 0.0, 1.0); // green

    //setElementBuffer(gl, buffers);
    
    //gl.bindVertexArray(buffers.vao);
    setPositionAttribute(gl, buffers, programInfo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

    console.log("circleColor: " + gl.getUniform(programInfo.program, programInfo.uniformLocations.circleColor));
    const numAttribs = gl.getProgramParameter(programInfo.program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttribs; i++) {
      let activeAttrib = gl.getActiveAttrib(programInfo.program, i);
      console.log("Active attribute: " + activeAttrib.name + ", size: " + activeAttrib.size + ", type: " + activeAttrib.type.toString(16));
    }
    {
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, nElements, gl.UNSIGNED_SHORT, offset);
      let error = gl.getError();
      if (error) {
        console.error("Error drawing elements: " + error);
      } else {
        console.log("Drawn " + nElements + " elements.");
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
    console.log("position buffer");
    console.log(buffers);
    console.log(buffers.position);
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
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  }

  export { drawScene };