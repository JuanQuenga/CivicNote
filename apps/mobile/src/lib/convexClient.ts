import { ConvexReactClient } from 'convex/react'
import { CONVEX_URL } from './env'

export const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null
