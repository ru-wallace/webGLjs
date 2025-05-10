#version 300 es

precision highp float;
uniform vec4 uColor;

out vec4 outColor;  

void main(void) {
    outColor = uColor;
}