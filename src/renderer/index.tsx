import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import log from 'loglevel';

import './index.css';
import "intro.js/introjs.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import './vendor/fontawesome-free/css/all.min.css'
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from "react-redux";
import store from "./store";

log.setLevel("error");

console.log('OnePad renderer starting...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Failed to find the root element');
  }

  console.log('Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering app...');
  root.render(
    <Provider store={store}>
        <App />
    </Provider>
  );
  
  console.log('App rendered successfully');
  
  //serviceWorker.register();

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals(console.log);
} catch (error) {
  console.error('Failed to initialize app:', error);
  document.body.innerHTML = `<div style="color: white; padding: 20px; font-family: monospace;">
    <h1>Failed to start OnePad</h1>
    <pre>${error}</pre>
  </div>`;
}
