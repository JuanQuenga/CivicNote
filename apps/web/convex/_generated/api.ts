/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * Re-run `pnpm convex:codegen` after `pnpm convex:dev` configures a deployment.
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server"
import { anyApi } from "convex/server"

import type * as seed from "../seed.js"
import type * as topics from "../topics.js"

const fullApi: ApiFromModules<{
  seed: typeof seed
  topics: typeof topics
}> = anyApi as any

export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any

export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any
