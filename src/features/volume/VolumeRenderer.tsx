import {useEffect, useRef} from 'react';
import {VolumeKind, VolumeRenderer} from './utils/volume-renderer';

import styles from './VolumeRenderer.module.scss';

interface IVolumeRendererProps {
  shaderType: 'default' | 'custom';
}

export const VolumeRendererComp: React.FC<IVolumeRendererProps> = ({shaderType}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VolumeRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const {width, height} = containerRef.current.getBoundingClientRect();

    VolumeRenderer.initialize({
      width,
      height,
      shaderType,
    }).then(volumeRenderer => {
      if (rendererRef.current) {
        return;
      }

      rendererRef.current = volumeRenderer
      containerRef.current?.appendChild(volumeRenderer.webGLRenderer.domElement);
      volumeRenderer.webGLRenderer.setPixelRatio(window.devicePixelRatio);
      volumeRenderer.loadVolume(`${import.meta.env.VITE_REPO_NAME ?? ''}/g1r01-010_020-pores.raw.zst`, VolumeKind.PORES);
    });

    return () => {
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.webGLRenderer.domElement);
        rendererRef.current?.despose();

        rendererRef.current = null
      }
    }
  }, [])

  return (

    <div ref={containerRef} className={styles.volumeRendererContainer}/>
  )
}