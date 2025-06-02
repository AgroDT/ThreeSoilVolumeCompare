import {useContext, useEffect, useRef} from 'react';
import {initializeCustomVolumeRenderer, initializeDefaultVolumeRenderer, type VolumeRendererBase} from './utils/volume-renderer';
import {ModelSize, ModelType} from '../../utils/const';

import styles from './VolumeRenderer.module.scss';
import {PerformanceContext} from '../../context/PerformanceProvider';

interface IVolumeRendererProps {
  shaderType: 'default' | 'custom',
  modelType: ModelType,
  modelSize: ModelSize,
}

export const VolumeRendererComp: React.FC<IVolumeRendererProps> = ({shaderType, modelType, modelSize}) => {
  const {setTimeToPaint} = useContext(PerformanceContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VolumeRendererBase | null>(null);

  useEffect(() => {
    performance.mark('volumeStart');
    if (!containerRef.current) {
      return;
    }

    const {width, height} = containerRef.current.getBoundingClientRect();

    const initialize = shaderType === 'custom' ? initializeCustomVolumeRenderer : initializeDefaultVolumeRenderer;
    const assetName = modelSize === ModelSize.SM
      ? modelType === ModelType.PORES ? 'g2r01_140-150_0375_pores.raw.zst' : 'g2r01_140-150_0375_solids.raw.zst'
      : modelType === ModelType.PORES ? 'g1r03_010-020_0750_pores.raw.zst' : 'g1r03_010-020_0750_solids.raw.zst';

    initialize({width, height}).then(volumeRenderer => {
      if (rendererRef.current) {
        return;
      }

      rendererRef.current = volumeRenderer;
      containerRef.current?.appendChild(volumeRenderer.webGLRenderer.domElement);
      volumeRenderer.webGLRenderer.setPixelRatio(window.devicePixelRatio);

      requestAnimationFrame(() => {
        performance.mark('volumeEnd');
        const totalTime = performance.measure('volumeMeasure', 'volumeStart', 'volumeEnd').duration;
        setTimeToPaint(totalTime);
      });

      volumeRenderer.loadVolume(`${import.meta.env.VITE_REPO_NAME ?? ''}/${assetName}`);
    });

    return () => {
      performance.clearMarks();
      performance.clearMeasures();
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.webGLRenderer.domElement);
        rendererRef.current.dispose();

        rendererRef.current = null;
      }
    };
  }, [modelType, modelSize]);

  return (
    <div
      ref={containerRef}
      className={styles.volumeRendererContainer}
    />
  );
};
