import {createContext, PropsWithChildren, useState, useEffect, useRef} from 'react';
import {getFps, calcFpsMedianAndMAD} from '../utils/performance';
import './PerformanceProvider.css';

type Values = Record<'median' | 'mad', number>;

type Stats = {
  fps: {val: number | null, stats: Values | null},
  memory: Values | null,
};

const FPSCounter = ({timeToPaint}: {timeToPaint?: number}) => {
  const [stats, setStats] = useState<Stats>({
    fps: {val: null, stats: null},
    memory: null,
  });
  const fpsHistory = useRef<number[]>([]);
  const ramMemory = useRef<number[]>([]);

  useEffect(() => {
    getFps(fps => {
      setStats(prev => ({...prev, fps: {...prev.fps, val: fps}}));
      fpsHistory.current.push(fps);
    });

    const calcUsedMemoryId = setInterval(() => {
      // @ts-ignore
      if (performance && performance?.memory) {
        // @ts-ignore
        const memory = performance.memory as any;
        ramMemory.current.push(memory.usedJSHeapSize / (1024 * 1024));
      } else {
        console.log('Not supported method performance.memory');
        clearInterval(calcUsedMemoryId);
      }
    }, 1000);

    const summarizeMetricsId = setInterval(() => {
      const {median: fpsMedian, mad: fpsMAD} = calcFpsMedianAndMAD(fpsHistory.current);
      const {median: ramMedian, mad: ramMAD} = calcFpsMedianAndMAD(ramMemory.current);

      setStats(prev => ({
        ...prev,
        fps: {...prev.fps, stats: {median: fpsMedian, mad: fpsMAD}},
        memory: {...prev.memory, median: ramMedian, mad: ramMAD},
      }));

      ramMemory.current = [];
      fpsHistory.current = [];
    }, 30000);

    return () => {
      clearInterval(summarizeMetricsId);
      clearInterval(calcUsedMemoryId);
    };
  }, []);

  return (
    <div>
      <div className='stats-container'>
        <span className='metric'>
          FPS:
          {' '}
          {stats.fps.val}
        </span>
        <span className='metric'>
          Time to first render:
          {' '}
          {timeToPaint?.toFixed(0)}
          {' '}
          ms.
        </span>
        <span className='metric'>
          FPS Median:
          {' '}
          {stats.fps.stats ? `${stats.fps.stats?.median} ± ${stats.fps.stats?.mad}` : 'Processing...'}
        </span>
        <span className='metric'>
          Used JS Heap Size:
          {' '}
          {stats.memory ? `${stats.memory?.median.toFixed(1)} MB ± ${stats.memory?.mad.toFixed(1)} MB` : 'Processing...'}
        </span>
      </div>
    </div>
  );
};

type PerformanceContextType = {
  setTimeToPaint: React.Dispatch<React.SetStateAction<number | undefined>>,
};

// eslint-disable-next-line react-refresh/only-export-components
export const PerformanceContext = createContext({} as PerformanceContextType);

export const PerformanceProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [timeToPaint, setTimeToPaint] = useState<number>();

  return (
    <PerformanceContext.Provider value={{setTimeToPaint}}>
      {children}
      <FPSCounter timeToPaint={timeToPaint}/>
    </PerformanceContext.Provider>
  );
};
