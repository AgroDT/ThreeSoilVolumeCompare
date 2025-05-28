import {createContext, PropsWithChildren, useState, useEffect} from 'react';
import {getFps} from '../utils/performance';

const FPSCounter = ({timeToPaint}: {timeToPaint?: number}) => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    getFps(setFps);
  }, [])

  return (
    <div>
      <div>
        <span>FPS: {fps}</span>
        <br />
        <span>Time to first render: {timeToPaint?.toFixed(0)} ms.</span>
      </div>
    </div>
  )
}

type PerformanceContextType = {
  setTimeToPaint: React.Dispatch<React.SetStateAction<number | undefined>>
}

export const PerformanceContext = createContext({} as PerformanceContextType);

export const PerformanceProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [timeToPaint, setTimeToPaint] = useState<number>();

  return (
    <PerformanceContext.Provider value={{setTimeToPaint}}>
      {children}
      <FPSCounter timeToPaint={timeToPaint}/>
    </PerformanceContext.Provider>
  )
}
