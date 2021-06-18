import { Color, MeshStandardMaterial, UniformsUtils } from 'three';

export const LogoGradientMaterial = new MeshStandardMaterial();
LogoGradientMaterial.userData = {
  heightOffset: {
    value: 0,
  },
};
LogoGradientMaterial.onBeforeCompile = (shader, _) => {
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
    heightRatio = (position.x + extent) / (2.0 * extent) + heightOffset;
   
    #include <begin_vertex>
    float undulate = heightOffset * heightOffset * 3.0;
    transformed = vec3(position.x, position.y, position.z + normal.z * undulate);
    `
    );
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
        value: new Color(0x694bfa),
      },
      opacity: {
        value: 0.8,
      },
    },
  ]);
  shader.uniforms.heightOffset = LogoGradientMaterial.userData.heightOffset;
};
