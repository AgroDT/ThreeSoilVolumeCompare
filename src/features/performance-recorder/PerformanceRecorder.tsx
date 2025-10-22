import {use} from 'react';
import {PerformanceContext} from '../../context/PerformanceProvider';

import './PerformanceRecorder.css';

export const PerformanceRecorder = () => {
  const {isPerformanceRecording, setIsPerformanceRecording} = use(PerformanceContext);

  return (
    <button
      className='performance-recorder'
      disabled={isPerformanceRecording}
      onClick={() => setIsPerformanceRecording(true)}
    >
      {isPerformanceRecording ? 'Processing...' : 'Record performance'}
    </button>
  );
};
