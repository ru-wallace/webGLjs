#version 300 es

precision highp float;
uniform vec4 uCircleColor;

out vec4 outColor;  

void main(void) {
    outColor = uCircleColor;
}