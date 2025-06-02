import {useState} from 'react';
import {Graphic} from './features/glb/Graphic';
import {VolumeRendererComp} from './features/volume/VolumeRenderer';
import {ModelSize, ModelType} from './utils/const';

import './App.css';

function App() {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [modelType, setModelType] = useState<ModelType>(ModelType.SOLIDS);
  const [size, setSize] = useState<ModelSize>(ModelSize.SM);

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
            className={`model-tab ${modelType === ModelType.SOLIDS ? 'tab_active' : ''}`}
            onClick={() => setModelType(ModelType.SOLIDS)}
          >
            Solids
          </button>
          <button
            className={`model-tab ${modelType === ModelType.PORES ? 'tab_active' : ''}`}
            onClick={() => setModelType(ModelType.PORES)}
          >
            Pores
          </button>
          <button
            className={`model-tab ${size === ModelSize.SM ? 'tab_active' : ''}`}
            onClick={() => setSize(ModelSize.SM)}
          >
            375 vx
          </button>
          <button
            className={`model-tab ${size === ModelSize.MD ? 'tab_active' : ''}`}
            onClick={() => setSize(ModelSize.MD)}
          >
            750 vx
          </button>
        </div>
      </div>
      {!activeTabIdx && (
        <div className='tab-content'>
          <Graphic
            modelType={modelType}
            modelSize={size}
          />
        </div>
      )}
      {activeTabIdx === 1 && (
        <div className='tab-content'>
          <VolumeRendererComp
            shaderType='default'
            modelType={modelType}
            modelSize={size}
          />
        </div>
      )}
      {activeTabIdx === 2 && (
        <div className='tab-content'>
          <VolumeRendererComp
            shaderType='custom'
            modelType={modelType}
            modelSize={size}
          />
        </div>
      )}
    </div>
  );
}

export default App;
