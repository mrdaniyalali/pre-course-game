import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { SettingsProvider } from './context/Settings.jsx'
import { ToastProvider } from './context/Toast.jsx'
import { ConvexRoot } from './multiplayer/ConvexClient.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConvexRoot>
      <HashRouter>
        <SettingsProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SettingsProvider>
      </HashRouter>
    </ConvexRoot>
  </React.StrictMode>
)
