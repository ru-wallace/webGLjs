
export function createMatrix(gl, rotateDegrees, translateX, translateY, scaleX=1, scaleY=1, offsetX=0, offsetY=0) {

  // console.log("Creating matrix with rotateDegrees: " + rotateDegrees + " translateX: " + translateX + " translateY: " + translateY + " scaleX: " + scaleX + " scaleY: " + scaleY);
  const uMatrix = glMatrix.mat3.create();

  


  glMatrix.mat3.projection(uMatrix, gl.canvas.clientWidth, gl.canvas.clientHeight);
  


  glMatrix.mat3.translate(uMatrix, uMatrix, [translateX, translateY]);
  glMatrix.mat3.rotate(uMatrix, uMatrix, rotateDegrees * Math.PI / 180);
  if (scaleX !== 1 || scaleY !== 1) {
    glMatrix.mat3.scale(uMatrix, uMatrix, [scaleX, scaleY]);
  }
  
  glMatrix.mat3.translate(uMatrix, uMatrix, [offsetX, offsetY]);
  glMatrix.mat3.translate(uMatrix, uMatrix, [-gl.canvas.clientWidth / 2, -gl.canvas.clientHeight / 2]);


  return uMatrix;
}

export function replaceMatrix(gl, matrix, rotateDegrees, translateX, translateY, scaleX=1, scaleY=1, offsetX=0, offsetY=0){
  glMatrix.mat3.projection(matrix, gl.canvas.clientWidth, gl.canvas.clientHeight);
  


  glMatrix.mat3.translate(matrix, matrix, [translateX, translateY]);
  glMatrix.mat3.rotate(matrix, matrix, rotateDegrees * Math.PI / 180);
  if (scaleX !== 1 || scaleY !== 1) {
    glMatrix.mat3.scale(matrix, matrix, [scaleX, scaleY]);
  }
  
  glMatrix.mat3.translate(matrix, matrix, [offsetX, offsetY]);
  glMatrix.mat3.translate(matrix, matrix, [-gl.canvas.clientWidth / 2, -gl.canvas.clientHeight / 2]);


  return matrix;
}