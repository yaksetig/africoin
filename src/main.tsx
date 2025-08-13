import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = createRoot(document.getElementById('root')!)
root.render(<App />)

const interval = setInterval(() => {
  const badge = document.querySelector(
    'lovable-badge, .lovable-badge, #lovable-badge',
  ) as HTMLElement | null
  if (badge) {
    badge.remove()
    clearInterval(interval)
  }
}, 100)
