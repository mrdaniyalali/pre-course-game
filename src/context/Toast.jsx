import { createContext, useContext, useCallback, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef(null)

  const toast = useCallback((text) => {
    setMsg(text)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 1700)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={'toast' + (show ? ' show' : '')} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
