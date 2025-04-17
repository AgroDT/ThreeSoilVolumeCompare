import {useEffect, useState} from 'react';
import {Graphic} from './features/gltf/Graphic';
import {VolumeRendererComp} from './features/volume/VolumeRenderer';
// import {usePerformance} from './hooks/usePerformance';
// import {trackFPS} from './utils/trackFps';
import {observePerformance, Performance} from './utils/performanceObserver';

import './App.css'

function App() {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [performance, setPerformance] = useState<Performance[]>([]);

  useEffect(() => {
    const {start, stop} = observePerformance((source) => setPerformance(prev => [...prev, source]))

    start()
    return () => {
      setPerformance([])
      stop();
    }
  }, [activeTabIdx])

  return (
    <div className='container'>
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
      <div>
        <div>
          <span>Source</span>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Size</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {performance?.map((perf) => (
                <tr key={perf.sourceName}>
                  <td>{perf.sourceName}</td>
                  <td>{perf.size}</td>
                  <td>{perf.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <span>FPS</span>
          <span>100</span>
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
  )
}

export default App
