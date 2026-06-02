import { useEffect, useRef, useState, useCallback } from 'react'

// A pausable seconds timer. start() begins counting, pause()/resume() toggle,
// stop() freezes, reset() zeroes it. `seconds` re-renders ~4x/sec.
export function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const startedAt = useRef(null)
  const elapsedBeforePause = useRef(0)
  const paused = useRef(false)
  const raf = useRef(null)

  const loop = useCallback(() => {
    if (!paused.current && startedAt.current != null) {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
    }
    raf.current = setTimeout(loop, 250)
  }, [])

  const start = useCallback(() => {
    startedAt.current = Date.now()
    elapsedBeforePause.current = 0
    paused.current = false
    setSeconds(0)
    clearTimeout(raf.current)
    loop()
  }, [loop])

  const stop = useCallback(() => {
    clearTimeout(raf.current)
    raf.current = null
  }, [])

  const reset = useCallback(() => {
    clearTimeout(raf.current)
    raf.current = null
    startedAt.current = null
    paused.current = false
    setSeconds(0)
  }, [])

  const pause = useCallback(() => {
    if (paused.current || startedAt.current == null) return
    paused.current = true
    elapsedBeforePause.current = Date.now() - startedAt.current
  }, [])

  const resume = useCallback(() => {
    if (!paused.current) return
    paused.current = false
    startedAt.current = Date.now() - elapsedBeforePause.current
  }, [])

  useEffect(() => () => clearTimeout(raf.current), [])

  return { seconds, start, stop, reset, pause, resume }
}
