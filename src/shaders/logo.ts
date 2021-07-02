import { Color, MeshStandardMaterial, UniformsUtils } from 'three';


// Shader for logo that provides gradient animations
export const LogoGradientMaterial = new MeshStandardMaterial();
LogoGradientMaterial.userData = {
  heightOffset: {
    value: 0,
  },
};

LogoGradientMaterial.onBeforeCompile = (shader, _) => {
  // subtle grow-shrink mesh on z axis
  shader.vertexShader = shader.vertexShader
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
    heightRatio = 1.0 - (position.y + extent) / (2.0 * extent) + heightOffset;
   
    #include <begin_vertex>
    float undulate = heightOffset * heightOffset * 3.0;
    transformed = vec3(position.x, position.y, position.z + normal.z * undulate);
    `
    );

  // set color based on height
  shader.fragmentShader = shader.fragmentShader
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
  shader.uniforms = UniformsUtils.merge([
    //fixed uniforms
    shader.uniforms,
    {
      colorBottom: {
        value: new Color(0x00f2fe),
      },
      colorTop: {
        value: new Color(0x2431e5),
      }
    },
  ]);
  shader.uniforms.heightOffset = LogoGradientMaterial.userData.heightOffset;
};
