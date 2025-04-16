import {useCallback, useEffect, useState} from 'react';

const isResourceEntry = (entry: PerformanceEntry): entry is PerformanceResourceTiming => {
  return entry.entryType === 'resource' && /\.(gltf|bin|zst)$ /.test(entry.name);
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units: ['B', 'KB', 'MB'] = ['B', 'KB', 'MB'];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = parseFloat((bytes / Math.pow(1024, exp)).toFixed(2));
  
  return `${value} ${units[exp]}`;
}

type Performance = {
  sourceName: string,
  duration: string,
  size: string,
}

export const usePerformance = () => {
  const [loadPerformance, setLoadPerformance] = useState<Performance>();

  const trackFPS = useCallback((callback: (fps: number) => void) => {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let currentFps = 0;
    
    const observeFPS = () => {
      const now = performance.now();
      frameCount++;
      
      if (now >= lastFrameTime + 1000) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        callback(currentFps);
        frameCount = 0;
        lastFrameTime = now;
      }
      
      requestAnimationFrame(observeFPS);
    }

    return observeFPS;
  }, []);

  useEffect(() => {
    const perfObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.filter(isResourceEntry).forEach(resource => {
        setLoadPerformance({
          sourceName: resource.name,
          duration: resource.duration.toFixed(2),
          size: formatSize(resource.encodedBodySize)
        });
      });
    });

    perfObserver.observe({entryTypes: ['resource']})
  }, [])

  return {loadPerformance, trackFPS};
}