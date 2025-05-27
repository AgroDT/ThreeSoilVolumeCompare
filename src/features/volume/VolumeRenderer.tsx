import {useEffect, useRef} from 'react';
import {initializeCustomVolumeRenderer, initializeDefaultVolumeRenderer, type VolumeRendererBase} from './utils/volume-renderer';

import styles from './VolumeRenderer.module.scss';

interface IVolumeRendererProps {
  shaderType: 'default' | 'custom',
  modelType: 'pores' | 'solids',
}

export const VolumeRendererComp: React.FC<IVolumeRendererProps> = ({shaderType, modelType}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VolumeRendererBase | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const {width, height} = containerRef.current.getBoundingClientRect();

    const initialize = shaderType === 'custom' ? initializeCustomVolumeRenderer : initializeDefaultVolumeRenderer;
    const assetName = modelType === 'pores' ? 'g1r03_010-020_0750_pores.raw.zst' : 'g1r03_010-020_0750_solids.raw.zst';

    initialize({width, height}).then(volumeRenderer => {
      if (rendererRef.current) {
        return;
      }

      rendererRef.current = volumeRenderer;
      containerRef.current?.appendChild(volumeRenderer.webGLRenderer.domElement);
      volumeRenderer.webGLRenderer.setPixelRatio(window.devicePixelRatio);
      volumeRenderer.loadVolume(`${import.meta.env.VITE_REPO_NAME ?? ''}/${assetName}`);
    });

    return () => {
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.webGLRenderer.domElement);
        rendererRef.current.dispose();

        rendererRef.current = null;
      }
    };
  }, [modelType]);

  return (
    <div
      ref={containerRef}
      className={styles.volumeRendererContainer}
    />
  );
};
