import {useContext, useEffect, useRef} from 'react';
import {initializeCustomVolumeRenderer, initializeDefaultVolumeRenderer, type VolumeRendererBase} from './utils/volume-renderer';

import styles from './VolumeRenderer.module.scss';
import {PerformanceContext} from '../../context/PerformanceProvider';

interface IVolumeRendererProps {
  shaderType: 'default' | 'custom';
}

export const VolumeRendererComp: React.FC<IVolumeRendererProps> = ({shaderType}) => {
  const {setTimeToPaint} = useContext(PerformanceContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VolumeRendererBase | null>(null);
  const loadStartTime = useRef(performance.now());
  const rafId = useRef<number>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const {width, height} = containerRef.current.getBoundingClientRect();

    const initialize = shaderType === 'custom' ? initializeCustomVolumeRenderer : initializeDefaultVolumeRenderer;

    initialize({width, height}).then(volumeRenderer => {
      if (rendererRef.current) {
        return;
      }

      rendererRef.current = volumeRenderer
      containerRef.current?.appendChild(volumeRenderer.webGLRenderer.domElement);
      volumeRenderer.webGLRenderer.setPixelRatio(window.devicePixelRatio);

      const checkFirstRender = () => {
        if (isFirstRender.current && rendererRef.current) {
          const totalTime = performance.now() - loadStartTime.current;
          console.log({totalTime})
          setTimeToPaint(totalTime);
          isFirstRender.current = false;
        } else {
          rafId.current = requestAnimationFrame(checkFirstRender);
        }
      };

      rafId.current = requestAnimationFrame(checkFirstRender);

      volumeRenderer.loadVolume(`${import.meta.env.VITE_REPO_NAME ?? ''}/g1r01-010_020-pores.raw.zst`);
    });

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.webGLRenderer.domElement);
        rendererRef.current.dispose();

        rendererRef.current = null
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={styles.volumeRendererContainer}/>
  )
}
