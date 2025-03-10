import * as THREE from 'three';
import defaultFragmentShader from '../shaders/default-volume.frag.glsl?raw';
import defaultVertexShader from '../shaders/default-volume.vert.glsl?raw';
import customFragmentShader from '../shaders/custom-volume.frag.glsl?raw';
import customVertexShader from '../shaders/custom-volume.vert.glsl?raw';

export const SCALE = {
  MAX: 200,
  MIN: 100,
};

export const CLIP = {
  MIN: 0.0,
  MAX: 1.0,
};

export type IClipPlanes = {
  xAxis: readonly number[],
  yAxis: readonly number[],
  zAxis: readonly number[],
};

export const calcScalePercentage = (currentDistance: number, minDistance: number, maxDistance: number) => (currentDistance < minDistance
  ? SCALE.MIN
  : currentDistance > maxDistance
    ? SCALE.MAX
    : SCALE.MIN + (((currentDistance - minDistance) / (maxDistance - minDistance)) * (SCALE.MAX - SCALE.MIN)));

export type IVolumeShaderUniforms = {
  u_data: THREE.IUniform<THREE.Data3DTexture>,
  u_cmdata: THREE.IUniform<THREE.Texture>,
  u_size: THREE.IUniform<THREE.Vector3>,
  u_renderthreshold: THREE.IUniform<number>,
  u_clim: THREE.IUniform<THREE.Vector2>,
  u_min_distance: THREE.IUniform<THREE.Vector3>,
  u_max_distance: THREE.IUniform<THREE.Vector3>,
};

type ICreateShaderMaterialParameters = Omit<THREE.ShaderMaterialParameters, 'uniforms' | 'vertexShader' | 'fragmentShader' | 'side'> & {
  shaderType?: 'default' | 'custom',
  data: THREE.Data3DTexture,
  cmData: THREE.Texture,
  size: THREE.Vector3,
  renderThreshold?: number,
  clim?: THREE.Vector2,
  u_min_distance?: THREE.Vector3,
  u_max_distance?: THREE.Vector3,
};

export function createShaderMaterial({
  shaderType = 'default',
  data,
  cmData,
  size,
  renderThreshold = 0,
  clim = new THREE.Vector2(0, 1),
  u_min_distance = new THREE.Vector3(0.0, 0.0, 0.0),
  u_max_distance = new THREE.Vector3(1.0, 1.0, 1.0),
  ...parameters
}: ICreateShaderMaterialParameters) {
  const uniforms: IVolumeShaderUniforms = {
    u_data: {value: data},
    u_cmdata: {value: cmData},
    u_size: {value: size},
    u_renderthreshold: {value: renderThreshold},
    u_clim: {value: clim},
    u_min_distance: {value: u_min_distance},
    u_max_distance: {value: u_max_distance},
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: shaderType === 'default' ? defaultVertexShader : customVertexShader,
    fragmentShader: shaderType === 'default' ? defaultFragmentShader : customFragmentShader,
    side: THREE.BackSide,
    ...parameters,
  });
}