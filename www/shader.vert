#version 300 es

in vec2 aVertexPosition;

uniform mat3 uMatrix;


void main(void) {
    gl_Position = vec4((uMatrix * vec3(aVertexPosition, 1)).xy, 0, 1);
}