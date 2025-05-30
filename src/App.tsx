import {useState} from 'react';
import {Graphic} from './features/glb/Graphic';
import {VolumeRendererComp} from './features/volume/VolumeRenderer';

import './App.css';

function App() {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [modelType, setModelType] = useState<'solids' | 'pores'>('solids');

  return (
    <div className='container'>
      <div className='switchers'>
        <div className='tabs-container'>
          <button
            className={`tab ${!activeTabIdx ? 'tab_active' : ''}`}
            onClick={() => setActiveTabIdx(0)}
          >
            GLB
          </button>
          <button
            className={`tab ${activeTabIdx === 1 ? 'tab_active' : ''}`}
            onClick={() => setActiveTabIdx(1)}
          >
            Three.js VolumeShader
          </button>
          <button
            className={`tab ${activeTabIdx === 2 ? 'tab_active' : ''}`}
            onClick={() => setActiveTabIdx(2)}
          >
            Custom shader
          </button>
        </div>
        <div className='models-container'>
          <button
            className={`tab ${modelType === 'solids' ? 'tab_active' : ''}`}
            onClick={() => setModelType('solids')}
          >
            Solids
          </button>
          <button
            className={`tab ${modelType === 'pores' ? 'tab_active' : ''}`}
            onClick={() => setModelType('pores')}
          >
            Pores
          </button>
        </div>
      </div>
      {!activeTabIdx && (
        <div className='tab-content'>
          <Graphic modelType={modelType}/>
        </div>
      )}
      {activeTabIdx === 1 && (
        <div className='tab-content'>
          <VolumeRendererComp
            shaderType='default'
            modelType={modelType}
          />
        </div>
      )}
      {activeTabIdx === 2 && (
        <div className='tab-content'>
          <VolumeRendererComp
            shaderType='custom'
            modelType={modelType}
          />
        </div>
      )}
    </div>
  );
}

export default App;
