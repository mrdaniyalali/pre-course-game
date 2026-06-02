import { ls } from '../lib/storage.js'

// A stable anonymous identity for this device — no login required.
export function getPlayerId() {
  let id = ls.get('player.id', null)
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    ls.set('player.id', id)
  }
  return id
}

export function getPlayerName() {
  return ls.get('player.name', '') || ''
}

export function setPlayerName(name) {
  ls.set('player.name', name)
}
