import {Html} from '@react-three/drei'

import './LoadingFallback.css'

export const LoadingFallback = () => {
  return (
    <Html wrapperClass='loader'>
      <span className='content'>Загрузка...</span>
    </Html>
  )
};