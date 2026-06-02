import { useEffect, useState, useCallback } from 'react'

// Captures the browser's deferred install prompt so we can surface our own
// "Install" button. Returns { canInstall, promptInstall }.
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } finally {
      setDeferred(null)
    }
  }, [deferred])

  return { canInstall: !!deferred && !installed, promptInstall }
}
