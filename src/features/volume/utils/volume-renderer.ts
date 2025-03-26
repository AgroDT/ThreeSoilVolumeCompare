import * as THREE from 'three';
import {OrbitControls, OrbitControlsEventMap} from 'three/addons/controls/OrbitControls.js';
import {ZstdVolumeLoader, type Volume, loadZSTDDecLib} from '@agrodt/three-zstd-volume-loader';
import type {SoilShaderUniforms} from '@agrodt/three-soil-volume-shader';
import {createCustomShaderMaterial, createDefaultShaderMaterial, IDefaultShaderUniforms} from './utils';
import cmDefaultWebp from '../../../assets/cm-default.webp';

const CAMERA_OFFSET_FACTOR = 1.75;

type IControlsEventHandlers = Record<keyof OrbitControlsEventMap, THREE.EventListener<unknown, keyof OrbitControlsEventMap, OrbitControls>>;

export interface VolumeRendererInitializationOptions {
  width: number,
  height: number,
  manager?: THREE.LoadingManager,
  controlsEvents?: Partial<IControlsEventHandlers>,
}

export function initializeDefaultVolumeRenderer(options: VolumeRendererInitializationOptions): Promise<DefaultVolumeRenderer> {
  return initializeVolumeRendererResources(options).then(res => new DefaultVolumeRenderer(res));
}

export function initializeCustomVolumeRenderer(options: VolumeRendererInitializationOptions): Promise<CustomVolumeRenderer> {
  return initializeVolumeRendererResources(options).then(res => new CustomVolumeRenderer(res));
}

type IRenderParameters = {
  renderThreshold: number,
};

interface IVolumeRendererResources {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  controls: OrbitControls;
  volumeLoader: ZstdVolumeLoader;
  cmTexture: THREE.Texture;
  controlsEvents?: Partial<IControlsEventHandlers>;
}

async function initializeVolumeRendererResources({
  width,
  height,
  manager,
  controlsEvents,
}: VolumeRendererInitializationOptions): Promise<IVolumeRendererResources> {
  const [volumeLoader, cmTexture] = await Promise.all([
    loadZSTDDecLib().then(zstd => new ZstdVolumeLoader(zstd, manager)),
    new THREE.TextureLoader().loadAsync(cmDefaultWebp),
  ]);

  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({alpha: true});
  renderer.localClippingEnabled = true;
  renderer.setSize(width, height);

  const camera = new THREE.OrthographicCamera();
  camera.up.set(0, 0, 1);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minZoom = 1;
  controls.maxZoom = 5;
  controls.enablePan = false;
  controls.update();

  return {scene, renderer, camera, controls, volumeLoader, cmTexture, controlsEvents};
}

export abstract class VolumeRendererBase {
  scene: THREE.Scene;

  renderer: THREE.WebGLRenderer;

  camera: THREE.OrthographicCamera;

  controls: OrbitControls;

  volumeLoader: ZstdVolumeLoader;

  cmTexture: THREE.Texture;

  material: THREE.ShaderMaterial | null = null;

  controlsEvents?: Partial<IControlsEventHandlers>;

  constructor({
    scene,
    renderer,
    camera,
    controls,
    volumeLoader,
    cmTexture,
    controlsEvents,
  }: IVolumeRendererResources) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;
    this.volumeLoader = volumeLoader;
    this.cmTexture = cmTexture;
    this.controlsEvents = controlsEvents;

    controls.addEventListener('change', this.render);

    if (controlsEvents) {
      Object.entries(controlsEvents).forEach(([event, handler]) => {
        controls.addEventListener(event as keyof OrbitControlsEventMap, handler);
      });
    }
  }

  public get webGLRenderer() {
    return this.renderer;
  }

  public loadVolume = (url: string) => {
    this.volumeLoader.load(url, this.onVolumeLoad);
  };

  public abstract setRenderParameters(parameters: IRenderParameters): void;

  public zoomIn = (step: number) => {
    this.camera.zoom = Math.min(this.camera.zoom + step, this.controls.maxZoom);
    this.camera.updateProjectionMatrix();
    this.render();
  };

  public zoomOut = (step: number) => {
    this.camera.zoom = Math.max(this.camera.zoom - step, this.controls.minZoom);
    this.camera.updateProjectionMatrix();
    this.render();
  };

  public dispose = () => {
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);

      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    }

    this.cmTexture.dispose();

    if (this.controlsEvents) {
      Object.entries(this.controlsEvents).forEach(([event, handler]) => {
        this.controls.removeEventListener(event as keyof OrbitControlsEventMap, handler);
      });
    }

    this.renderer.dispose();
  };

  protected render = () => {
    this.renderer.render(this.scene, this.camera);
  };

  protected abstract getShaderMaterial(data: THREE.Data3DTexture, size: THREE.Vector3): THREE.ShaderMaterial;

  private onVolumeLoad = ({data, xSize, ySize, zSize}: Volume) => {
    const texture = new THREE.Data3DTexture(data, xSize, ySize, zSize);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    this.material = this.getShaderMaterial(texture, new THREE.Vector3(xSize, ySize, zSize));

    const halfXSize = xSize / 2;
    const halfYSize = ySize / 2;
    const halfZSize = zSize / 2;

    const geometry = new THREE.BoxGeometry(xSize, ySize, zSize)
      .translate(halfXSize, halfYSize, halfZSize);

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    const renderSize = this.renderer.getSize(new THREE.Vector2());
    const {horizontal, vertical} = VolumeRendererBase.getCameraPlanes(
      renderSize.width / renderSize.height,
      halfZSize,
      Math.max(xSize, ySize) / 2,
    );
    this.camera.left = -horizontal;
    this.camera.right = horizontal;
    this.camera.bottom = -vertical;
    this.camera.top = vertical;
    this.camera.position.set(xSize, ySize, zSize * 0.75);
    this.camera.updateProjectionMatrix();

    this.controls.target.set(halfXSize, halfYSize, halfZSize);
    this.controls.update();

    this.render();
  };

  private static getCameraPlanes = (aspect: number, halfZSize: number, radius: number) => {
    if (aspect >= 1) {
      return {
        horizontal: radius * aspect * CAMERA_OFFSET_FACTOR,
        vertical: halfZSize * CAMERA_OFFSET_FACTOR,
      };
    }
    return {
      horizontal: radius * CAMERA_OFFSET_FACTOR,
      vertical: halfZSize / aspect * CAMERA_OFFSET_FACTOR,
    };
  };
}

export class DefaultVolumeRenderer extends VolumeRendererBase {
  public setRenderParameters = ({renderThreshold}: IRenderParameters) => {
    if (!this.material) {
      return;
    }

    (this.material.uniforms as IDefaultShaderUniforms).u_renderthreshold.value = renderThreshold;

    this.render();
  };

  protected getShaderMaterial = (data: THREE.Data3DTexture, size: THREE.Vector3): THREE.ShaderMaterial => createDefaultShaderMaterial({
    data,
    size,
    cmData: this.cmTexture,
    clipping: true,
  });
}

export class CustomVolumeRenderer extends VolumeRendererBase {
  public setRenderParameters = ({renderThreshold}: IRenderParameters) => {
    if (!this.material) {
      return;
    }

    (this.material.uniforms as SoilShaderUniforms).u_render_threshold.value = renderThreshold;

    this.render();
  };

  protected getShaderMaterial = (data: THREE.Data3DTexture, size: THREE.Vector3): THREE.ShaderMaterial => createCustomShaderMaterial({
    data,
    size,
    cmData: this.cmTexture,
    clipping: true,
    maxDistance: new THREE.Vector3(0.5, 1.0, 1.0),
  });
}
