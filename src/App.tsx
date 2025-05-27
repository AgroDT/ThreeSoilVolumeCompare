import {useState} from 'react';
import {Graphic} from './features/gltf/Graphic';
import {VolumeRendererComp} from './features/volume/VolumeRenderer';

import './App.css';

function App() {
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  return (
    <div className='container'>
      <div className='switchers'>
        <div className='tabs-container'>
          <button
            className={`tab ${!activeTabIdx ? 'tab_active' : ''}`}
            onClick={() => setActiveTabIdx(0)}
          >
            GLTF
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
      </div>
      {!activeTabIdx && (
        <div className='tab-content'>
          <Graphic/>
        </div>
      )}
      {activeTabIdx === 1 && (
        <div className='tab-content'>
          <VolumeRendererComp shaderType='default'/>
        </div>
      )}
      {activeTabIdx === 2 && (
        <div className='tab-content'>
          <VolumeRendererComp shaderType='custom'/>
        </div>
      )}
    </div>
  );
}

export default App;
