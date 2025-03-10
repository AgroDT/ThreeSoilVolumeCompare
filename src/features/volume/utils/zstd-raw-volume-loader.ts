import * as THREE from 'three';
import {ZSTDDecoder} from 'three/addons/libs/zstddec.module.js';

export interface Volume {
  width: number;
  height: number;
  depth: number;
  data: Uint8Array;
}

export class ZstdRawVolumeLoader extends THREE.Loader<Volume> {
  private decoder: ZSTDDecoder;
  private fileLoader: THREE.FileLoader;

  constructor(decoder: ZSTDDecoder, manager?: THREE.LoadingManager) {
    super(manager);
    this.decoder = decoder;
    this.fileLoader = new THREE.FileLoader(manager);
    this.fileLoader.responseType = 'arraybuffer';
  }

  public static async initialize(manager?: THREE.LoadingManager): Promise<ZstdRawVolumeLoader> {
    const decoder = new ZSTDDecoder();
    await decoder.init();

    return new ZstdRawVolumeLoader(decoder, manager);
  }

  public load = (
    url: string,
    onLoad?: (volume: Volume) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ): void => {
    let onLoad2;
    if (onLoad) {
      onLoad2 = (data: string | ArrayBuffer) => {
        const volume = this.processData(data as ArrayBuffer);
        if (volume) {
          onLoad!(volume);
        } else if (onError) {
          onError(new Error('Failed to parse metadata'));
        }
      };
    }
    this.fileLoader.load(url, onLoad2, onProgress, onError);
  }

  private processData = (compressed: ArrayBuffer): Volume | null => {
    const metadata = ZstdRawVolumeLoader.readMetadata(compressed);
    if (!metadata) {
      return null;
    }

    const data = this.decoder.decode(new Uint8Array(compressed));

    return { ...metadata, data };
  }

  private static readMetadata(compressed: ArrayBuffer) {
    const view = new DataView(compressed);

    const magic = view.getUint32(0, true);
    if ((magic & 0xFFFFFFF0) !== 0x184D2A50) {
      return null;
    }

    const length = view.getUint32(4, true);
    const metadata = compressed.slice(8, 8 + length);

    return JSON.parse(new TextDecoder().decode(metadata));
  }
}
