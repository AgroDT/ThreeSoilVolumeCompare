import * as THREE from 'three';
import {type CreateSoilShaderMaterialParameters} from '@agrodt/three-soil-volume-shader';
import {VolumeRenderShader1} from 'three/examples/jsm/shaders/VolumeShader.js';

export {default as createCustomShaderMaterial} from '@agrodt/three-soil-volume-shader';

export type IDefaultShaderUniforms = typeof VolumeRenderShader1['uniforms'];

type ICreateDefaultShaderMaterialParameters = Omit<CreateSoilShaderMaterialParameters, 'minDistance' | 'maxDistance'> & {
  clim?: THREE.Vector2,
};

export function createDefaultShaderMaterial({
  data,
  cmData,
  size,
  renderThreshold = 0,
  clim = new THREE.Vector2(0, 1),
  ...parameters
}: ICreateDefaultShaderMaterialParameters): THREE.ShaderMaterial {
  const uniforms: IDefaultShaderUniforms = {
    // ISO
    u_renderstyle: {value: 1},
    u_data: {value: data},
    u_cmdata: {value: cmData},
    u_size: {value: size},
    u_renderthreshold: {value: renderThreshold},
    u_clim: {value: clim},
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VolumeRenderShader1.vertexShader,
    fragmentShader: VolumeRenderShader1.fragmentShader,
    side: THREE.BackSide,
    ...parameters,
  });
}
