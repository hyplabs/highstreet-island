import { Color, ShaderLib, ShaderMaterial, UniformsUtils } from 'three';

const VertexShader = `
    varying vec3 vUv; 
    varying float heightRatio;
    uniform float heightOffset;
    
    void main() {
      vUv = position;
      float extent = 4.5; 
      heightRatio = (position.x + extent) / (2.0 * extent) + heightOffset;
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
`;

const FragmentShader = `
    varying vec3 vUv; 
    varying float heightRatio; 
    uniform vec3 colorBottom; 
    uniform vec3 colorTop;
    
    void main() {
      gl_FragColor = vec4(mix(colorBottom, colorTop, heightRatio), 1.0);
    }
`;

let vertexShader = ShaderLib.standard.vertexShader
  .replace(
    `#include <common>`,
    `#include <common>
    varying float heightRatio;
    uniform float heightOffset;
    uniform float glitch;
    `
  )
  .replace(
    `#include <begin_vertex>`,
    `
    float extent = 4.0;     
    heightRatio = (position.x + extent) / (2.0 * extent) + heightOffset;
   
    #include <begin_vertex>
    float undulate = heightOffset * heightOffset * 3.0;
    transformed = vec3(position.x, position.y, position.z + normal.z * undulate);
    `
  );

let fragmentShader = ShaderLib.standard.fragmentShader
  .replace(
    `vec4 diffuseColor = vec4( diffuse, opacity );`,
    `vec4 diffuseColor = vec4(mix(colorBottom, colorTop, heightRatio), opacity);`
  )
  .replace(
    //add extra uniforms and
    `uniform vec3 diffuse;`,
    `
    uniform vec3 diffuse;
    varying float heightRatio; 
    uniform vec3 colorBottom; 
    uniform vec3 colorTop;`
  );

console.log(vertexShader);
console.log(fragmentShader);

export const LogoGradientMaterial = new ShaderMaterial({
  uniforms: UniformsUtils.merge([
    ShaderLib.standard.uniforms,
    {
      colorBottom: {
        value: new Color(0x00f2fe),
      },
      colorTop: {
        value: new Color(0x694bfa),
      },
      heightOffset: {
        value: 0,
      },
      opacity: {
        value: 0.8,
      },
    },
  ]),
  fragmentShader: fragmentShader,
  // vertexShader: VertexShader
  lights: true,
  vertexShader: vertexShader,
  // transparent: true,
});
