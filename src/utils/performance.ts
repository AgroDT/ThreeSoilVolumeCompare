export const getFps = (callback: (fps: number) => void) => {
  let prevTime = Date.now();
  let frames = 0;

  const loop = () => {
    const time = Date.now();
    frames++;
    if (time > prevTime + 1000) {
      const fps = Math.round((frames * 1000) / (time - prevTime));
      prevTime = time;
      frames = 0;

      callback(fps);
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};
