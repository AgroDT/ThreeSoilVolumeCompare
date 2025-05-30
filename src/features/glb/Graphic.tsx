import {Suspense, useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import {LoadingFallback} from './LoadingFallback';
import {ModelLoader} from './ModelLoader';
import * as THREE from 'three';

import './Graphic.css';

interface IGraphicProps {
  modelType: 'pores' | 'solids',
}

export const Graphic: React.FC<IGraphicProps> = ({modelType}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const assetUrl = modelType === 'pores' ? 'g2r01_140-150_0750_pores.glb' : 'g2r01_140-150_0750_solids.glb';
  const loadStartTime = useRef(performance.now());

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
              loadStartTime={loadStartTime.current}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};