export type Performance = {
  sourceName: string,
  duration: string,
  size: string,
}

const isResourceEntry = (entry: PerformanceEntry): entry is PerformanceResourceTiming => {
  return entry.entryType === 'resource' && /\.(gltf|bin|zst)$/.test(entry.name);
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units: ['B', 'KB', 'MB'] = ['B', 'KB', 'MB'];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = parseFloat((bytes / Math.pow(1024, exp)).toFixed(2));
  
  return `${value} ${units[exp]}`;
}

export const observePerformance = (callback: (resource: Performance) => void) => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.filter(isResourceEntry).forEach(resource => {
      callback({
        sourceName: resource.name,
        duration: resource.duration.toFixed(2),
        size: formatSize(resource.encodedBodySize)
      })
    });
  })

  return {
    start: () =>  observer.observe({entryTypes: ['resource']}),
    stop: () => observer.disconnect(),
  }
};