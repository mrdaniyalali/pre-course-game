// Small shared utilities used across games.

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function fmtTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function range(n) {
  return Array.from({ length: n }, (_, i) => i)
}

export function clsx(...parts) {
  return parts.filter(Boolean).join(' ')
}
