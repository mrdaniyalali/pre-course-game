import { createContext, useContext, useEffect } from 'react'
import { useStored } from '../lib/storage.js'
import { setSoundEnabled, sfx } from '../lib/sound.js'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useStored('ui.theme', 'dark')
  const [sound, setSound] = useStored('ui.sound', true)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#14110b' : '#ece2cd')
  }, [theme])

  useEffect(() => {
    setSoundEnabled(sound)
  }, [sound])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const toggleSound = () =>
    setSound((s) => {
      const next = !s
      setSoundEnabled(next)
      if (next) sfx.flip()
      return next
    })

  return (
    <SettingsContext.Provider value={{ theme, sound, toggleTheme, toggleSound }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
