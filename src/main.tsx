import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {PerformanceProvider} from './context/PerformanceProvider.tsx'
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PerformanceProvider>
      <App/>
    </PerformanceProvider>
  </StrictMode>
);
