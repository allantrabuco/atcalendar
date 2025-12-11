import React from 'react';

import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './style/index.css';

const AppWrapper: React.ComponentType<{ children?: React.ReactNode }> = import.meta.env.DEV
  ? ({ children }) => <>{children}</>
  : React.StrictMode;

createRoot(document.getElementById('root')!).render(
  <AppWrapper>
    <App />
  </AppWrapper>
);
