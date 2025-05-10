
export function createMatrix(gl, rotateDegrees, translateX, translateY, scaleX=1, scaleY=1) {

  // console.log("Creating matrix with rotateDegrees: " + rotateDegrees + " translateX: " + translateX + " translateY: " + translateY + " scaleX: " + scaleX + " scaleY: " + scaleY);
  const uMatrix = glMatrix.mat3.create();

  


  glMatrix.mat3.projection(uMatrix, gl.canvas.clientWidth, gl.canvas.clientHeight);
  


  glMatrix.mat3.translate(uMatrix, uMatrix, [translateX, translateY]);
  glMatrix.mat3.rotate(uMatrix, uMatrix, rotateDegrees * Math.PI / 180);
  if (scaleX !== 1 || scaleY !== 1) {
    glMatrix.mat3.scale(uMatrix, uMatrix, [scaleX, scaleY]);
  }
  
  glMatrix.mat3.translate(uMatrix, uMatrix, [-gl.canvas.clientWidth / 2, -gl.canvas.clientHeight / 2]);


  return uMatrix;
}