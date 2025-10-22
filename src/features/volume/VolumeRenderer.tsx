import {useContext, useEffect, useMemo, useRef} from 'react';
import {initializeCustomVolumeRenderer, initializeDefaultVolumeRenderer, type VolumeRendererBase} from './utils/volume-renderer';
import {ModelSize, ModelType} from '../../utils/const';

import {PerformanceContext} from '../../context/PerformanceProvider';
import './VolumeRenderer.css';

interface IVolumeRendererProps {
  shaderType: 'default' | 'custom',
  modelType: ModelType,
  modelSize: ModelSize,
}

export const VolumeRendererComp: React.FC<IVolumeRendererProps> = ({shaderType, modelType, modelSize}) => {
  const {setTimeToPaint, isPerformanceRecording} = useContext(PerformanceContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VolumeRendererBase | null>(null);

  const spinAnimation = useMemo(() => {
    let angle = 0;
    const result = {} as {animationId: number, start: () => void};
    result.start = () => {
      if (!rendererRef.current) {
        return;
      }
      const {camera, controls, renderer, scene} = rendererRef.current;

      angle += 0.05;
      const radius = 200;
      camera.position.x = Math.sin(angle) * radius;
      camera.position.z = Math.cos(angle) * radius;
      camera.lookAt(0, 0, 0);

      controls.update();
      renderer.render(scene, camera);

      result.animationId = requestAnimationFrame(result.start);
    };

    return result;
  }, []);

  useEffect(() => {
    performance.mark('volumeStart');
    if (!containerRef.current) {
      return;
    }

    const {width, height} = containerRef.current.getBoundingClientRect();

    const initialize = shaderType === 'custom' ? initializeCustomVolumeRenderer : initializeDefaultVolumeRenderer;
    const assetName = modelSize === ModelSize.SM
      ? modelType === ModelType.PORES ? 'g2r01_140-150_0375_pores.raw.zst' : 'g2r01_140-150_0375_solids.raw.zst'
      : modelType === ModelType.PORES ? 'g2r01_140-150_0750_pores.raw.zst' : 'g2r01_140-150_0750_solids.raw.zst';

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

  useEffect(() => {
    if (isPerformanceRecording) {
      spinAnimation.start();
    } else if (spinAnimation.animationId && rendererRef.current) {
      cancelAnimationFrame(spinAnimation.animationId);
      const {camera, controls, scene} = rendererRef.current;

      camera.position.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
      controls.update();

      rendererRef.current?.renderer.render(scene, camera);
    }
  }, [isPerformanceRecording]);

  return (
    <div
      ref={containerRef}
      className='renderer-container'
    />
  );
};
