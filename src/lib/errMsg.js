// Extracts a human-readable message from a Convex error. ConvexError carries the
// thrown value on `.data` (this survives to the client in production); plain
// errors fall back to `.message`.
export function errMsg(e, fallback = 'Something went wrong') {
  if (e && typeof e.data === 'string') return e.data
  if (e && e.data && typeof e.data.message === 'string') return e.data.message
  return (e && e.message) || fallback
}
