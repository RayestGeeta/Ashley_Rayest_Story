import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { Analytics } from '@vercel/analytics/react' // Temporarily disabled to prevent crash
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <>
        <App />
        {/* <Analytics /> */}
    </>
)
