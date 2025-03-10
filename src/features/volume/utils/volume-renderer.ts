import * as THREE from 'three';
import {OrbitControls, OrbitControlsEventMap} from 'three/addons/controls/OrbitControls.js';
import {ZstdRawVolumeLoader, Volume} from './zstd-raw-volume-loader';
import {createShaderMaterial, IVolumeShaderUniforms, IClipPlanes} from './utils';
import cmDefaultWebp from '../../../assets/cm-default.webp';

type IControlsEventHandlers = Record<keyof OrbitControlsEventMap, THREE.EventListener<unknown, keyof OrbitControlsEventMap, OrbitControls>>;

export interface VolumeRendererInitializationOptions {
  width: number,
  height: number,
  shaderType: 'default' | 'custom',
  manager?: THREE.LoadingManager,
  controlsEvents?: Partial<IControlsEventHandlers>,
}

export enum VolumeKind {
  SOLIDS = 'SOLIDS',
  PORES = 'PORES'
}

type IRenderParameters = {
  renderThreshold: number,
};

export class VolumeRenderer {
  scene: THREE.Scene;

  renderer: THREE.WebGLRenderer;

  camera: THREE.OrthographicCamera;

  controls: OrbitControls;

  volumeLoader: ZstdRawVolumeLoader;

  colorMaps: Record<VolumeKind, THREE.Texture>;

  material: THREE.ShaderMaterial | null = null;

  controlsEvents?: Partial<IControlsEventHandlers>;

  shaderType: 'default' | 'custom';

  public static async initialize({
    width,
    height,
    manager,
    shaderType,
    controlsEvents,
  }: VolumeRendererInitializationOptions): Promise<VolumeRenderer> {
    const textureLoader = new THREE.TextureLoader();
    const [volumeLoader, cmDefault] = await Promise.all([
      ZstdRawVolumeLoader.initialize(manager),
      textureLoader.loadAsync(cmDefaultWebp),
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

    const colorMaps = {
      [VolumeKind.SOLIDS]: cmDefault,
      [VolumeKind.PORES]: cmDefault,
    };

    return new VolumeRenderer(scene, renderer, camera, controls, volumeLoader, colorMaps, shaderType, controlsEvents);
  }

  private constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.OrthographicCamera,
    controls: OrbitControls,
    volumeLoader: ZstdRawVolumeLoader,
    colorMaps: Record<VolumeKind, THREE.Texture>,
    shaderType: 'default' | 'custom',
    controlsEvents?: Partial<IControlsEventHandlers>,
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;
    this.volumeLoader = volumeLoader;
    this.colorMaps = colorMaps;
    this.controlsEvents = controlsEvents;
    this.shaderType = shaderType;

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

  public resize = (width: number, height: number) => {
    this.renderer.setSize(width, height);

    const factor = width / height / 2;
    const cameraPlane = (this.camera.top - this.camera.bottom) * factor;
    this.camera.left = -cameraPlane;
    this.camera.right = cameraPlane;
    this.camera.updateProjectionMatrix();

    this.render();
  };

  public loadVolume = (url: string, kind: VolumeKind) => {
    this.volumeLoader.load(url, volume => this.onVolumeLoad(volume, kind));
  };

  private render = () => {
    this.renderer.render(this.scene, this.camera);
  };

  public setRenderParameters = ({renderThreshold}: IRenderParameters) => {
    if (!this.material) {
      return;
    }

    const uniforms = this.material.uniforms as IVolumeShaderUniforms;
    uniforms.u_renderthreshold.value = renderThreshold;

    this.render();
  };

  public clipPlanes = ({xAxis, yAxis, zAxis}: IClipPlanes) => {
    if (!this.material) {
      return;
    }

    const uniforms = this.material.uniforms as IVolumeShaderUniforms;

    uniforms.u_min_distance.value = new THREE.Vector3(xAxis[0], yAxis[0], zAxis[0]);
    uniforms.u_max_distance.value = new THREE.Vector3(xAxis[1], yAxis[1], zAxis[1]);

    this.render();
  };

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

  private onVolumeLoad = ({width, height, depth, data}: Volume, kind: VolumeKind) => {
    const texture = new THREE.Data3DTexture(data, width, height, depth);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    this.material = createShaderMaterial({
      data: texture,
      size: new THREE.Vector3(width, height, depth),
      cmData: this.colorMaps[kind],
      shaderType: this.shaderType,
      clipping: true,
    });

    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.translate(halfWidth - 0.5, halfHeight - 0.5, halfDepth - 0.5);
    
    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
    
    const renderSize = this.renderer.getSize(new THREE.Vector2());
    const factor = renderSize.width / renderSize.height / 0.75;
    const cameraPlane = Math.max(halfWidth, halfHeight, halfDepth) * factor;
    this.camera.left = -cameraPlane;
    this.camera.right = cameraPlane;
    this.camera.bottom = -cameraPlane;
    this.camera.top = cameraPlane;
    this.camera.position.set(0, 0, cameraPlane / 2);
    this.camera.updateProjectionMatrix();

    this.clipPlanes({xAxis: [0.5, 1.0], yAxis: [0.0, 1.0], zAxis: [0.0, 1.0]});
    
    this.controls.target.set(halfWidth, halfHeight, halfDepth);
    this.controls.update();

    this.resize(renderSize.width, renderSize.height);
  };

  public despose = () => {
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

    Object.values(this.colorMaps).forEach(texture => texture.dispose());

    if (this.controlsEvents) {
      Object.entries(this.controlsEvents).forEach(([event, handler]) => {
        this.controls.removeEventListener(event as keyof OrbitControlsEventMap, handler);
      });
    }

    this.renderer.dispose();
  };
}
