import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'; // Initialize i18next before app renders
import axios from 'axios';

// Configure global Axios base URL for Vercel/Render cross-origin production routes
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://192.168.137.195:5000';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
