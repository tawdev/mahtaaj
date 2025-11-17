import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Import i18n first to ensure it's initialized before App renders
import './i18n';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
