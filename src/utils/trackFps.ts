export const trackFPS = (callback: (fps: number) => void) => {
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
};