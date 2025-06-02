import {Suspense, useEffect, useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import {LoadingFallback} from './LoadingFallback';
import {ModelLoader} from './ModelLoader';
import * as THREE from 'three';
import {ModelSize, ModelType} from '../../utils/const';

import './Graphic.css';

interface IGraphicProps {
  modelType: ModelType,
  modelSize: ModelSize,
}

export const Graphic: React.FC<IGraphicProps> = ({modelType, modelSize}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const assetUrl = modelSize === ModelSize.SM
    ? modelType === ModelType.PORES ? 'g2r01_140-150_0375_pores.glb' : 'g2r01_140-150_0375_solids.glb'
    : modelType === ModelType.PORES ? 'g2r01_140-150_0750_pores.glb' : 'g2r01_140-150_0750_solids.glb';

  useEffect(() => {
    performance.mark('graphicStart');

    return () => {
      performance.clearMarks();
      performance.clearMeasures();
    };
  }, [modelType]);

  return (
    <div className='container'>
      <div
        ref={containerRef}
        className='canvas-container'
      >
        <Canvas
          style={{height: '100%', width: '100%'}}
          gl={{clippingPlanes: [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)]}}
        >
          <ambientLight intensity={0.5}/>
          <directionalLight position={[10, 10, 10]}/>
          <directionalLight position={[-10, -10, -10]}/>
          <Suspense fallback={<LoadingFallback/>}>
            <ModelLoader
              url={`${import.meta.env.VITE_REPO_NAME ?? ''}/${assetUrl}`}
              color={0xFFCF48}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};