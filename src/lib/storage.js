// Safe localStorage wrapper + a tiny React hook for persisted values.
import { useCallback, useState } from 'react'

export const ls = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key)
      return v === null ? fallback : JSON.parse(v)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  },
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => ls.get(key, initial))
  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        ls.set(key, resolved)
        return resolved
      })
    },
    [key]
  )
  return [value, update]
}
