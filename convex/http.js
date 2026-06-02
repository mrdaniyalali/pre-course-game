// Exposes the OAuth callback / sign-in HTTP routes for Convex Auth.
import { httpRouter } from 'convex/server'
import { auth } from './auth.js'

const http = httpRouter()
auth.addHttpRoutes(http)

export default http
