import './styles/globals.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initGlobalErrorHandlers } from './services/errorReporter';
import { initWebVitals } from './services/webVitals';
import App from './App';

initGlobalErrorHandlers();
initWebVitals();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);