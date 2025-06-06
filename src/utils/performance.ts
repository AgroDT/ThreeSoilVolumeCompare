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

export const calcFpsMedianAndMAD = (fpsArr: number[]) => {
  const sortedArr = fpsArr.toSorted((prev, next) => prev - next);
  const middle = Math.floor(sortedArr.length / 2);
  const median = !(sortedArr.length % 2) ? (sortedArr[middle - 1] + sortedArr[middle]) / 2 : sortedArr[middle];

  const sortedAbs = fpsArr.map(num => Math.abs(num - median)).toSorted((prev, next) => prev - next);
  const abs = !(sortedAbs.length % 2) ? (sortedAbs[middle - 1] + sortedAbs[middle]) / 2 : sortedAbs[middle];

  return {median, mad: abs};
};