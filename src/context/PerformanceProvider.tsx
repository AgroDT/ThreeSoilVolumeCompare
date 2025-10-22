import {createContext, PropsWithChildren, useState, useEffect, useRef, useCallback} from 'react';
import {getFps, calcFpsMedianAndMAD} from '../utils/performance';
import './PerformanceProvider.css';

type Values = Record<'median' | 'mad', number>;

type Stats = {
  fps: {val: number | null, stats: Values | null},
  memory: Values | null,
};

type FPSCounterProps = {
  timeToPaint?: number,
  isPerformanceRecording: boolean,
  setIsPerformanceRecording: React.Dispatch<React.SetStateAction<boolean>>,
};

const FPSCounter: React.FC<FPSCounterProps> = ({timeToPaint, isPerformanceRecording, setIsPerformanceRecording}) => {
  const [stats, setStats] = useState<Stats>({
    fps: {val: null, stats: null},
    memory: null,
  });
  const fpsHistory = useRef<number[]>([]);
  const ramMemory = useRef<number[]>([]);
  const fpsReport = useRef<number[]>([]);

  const downloadReport = useCallback((report: number[]) => {
    const blob = new Blob([JSON.stringify({fps: report})], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'report.json';
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
  }, []);

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

  useEffect(() => {
    let result: ReturnType<typeof getFps>;
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isPerformanceRecording) {
      result = getFps(fps => fpsReport.current.push(fps));

      timeoutId = setTimeout(() => {
        cancelAnimationFrame(result.animationId);
        setIsPerformanceRecording(false);
        downloadReport(fpsReport.current);
        fpsReport.current = [];
      }, 60000);
    }

    return () => {
      if (result && timeoutId) {
        cancelAnimationFrame(result.animationId);
        clearTimeout(timeoutId);
        fpsReport.current = [];
      }
    };
  }, [isPerformanceRecording]);

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
  isPerformanceRecording: boolean,
  setTimeToPaint: React.Dispatch<React.SetStateAction<number | undefined>>,
  setIsPerformanceRecording: React.Dispatch<React.SetStateAction<boolean>>,
};

// eslint-disable-next-line react-refresh/only-export-components
export const PerformanceContext = createContext({} as PerformanceContextType);

export const PerformanceProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [timeToPaint, setTimeToPaint] = useState<number>();
  const [isPerformanceRecording, setIsPerformanceRecording] = useState(false);

  return (
    <PerformanceContext.Provider
      value={{
        isPerformanceRecording,
        setTimeToPaint,
        setIsPerformanceRecording,
      }}
    >
      {children}
      <FPSCounter
        timeToPaint={timeToPaint}
        isPerformanceRecording={isPerformanceRecording}
        setIsPerformanceRecording={setIsPerformanceRecording}
      />
    </PerformanceContext.Provider>
  );
};
