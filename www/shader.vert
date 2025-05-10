#version 300 es

in vec2 aVertexPosition;

uniform mat3 uMatrix;
uniform float uZLayer;


void main(void) {
    gl_Position = vec4((uMatrix * vec3(aVertexPosition, 1)).xy, uZLayer, 1);
}