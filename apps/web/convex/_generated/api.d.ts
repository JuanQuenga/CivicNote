/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as apiV1 from "../apiV1.js";
import type * as apnsNode from "../apnsNode.js";
import type * as crons from "../crons.js";
import type * as editorial from "../editorial.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as installations from "../installations.js";
import type * as lib_httpValidation from "../lib/httpValidation.js";
import type * as lib_installations from "../lib/installations.js";
import type * as lib_pushProviders from "../lib/pushProviders.js";
import type * as migrations from "../migrations.js";
import type * as mobileRegistration from "../mobileRegistration.js";
import type * as news from "../news.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as push from "../push.js";
import type * as rateLimit from "../rateLimit.js";
import type * as seed from "../seed.js";
import type * as seedCivic from "../seedCivic.js";
import type * as seedTopics from "../seedTopics.js";
import type * as subscriptions from "../subscriptions.js";
import type * as topics from "../topics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  apiV1: typeof apiV1;
  apnsNode: typeof apnsNode;
  crons: typeof crons;
  editorial: typeof editorial;
  events: typeof events;
  http: typeof http;
  installations: typeof installations;
  "lib/httpValidation": typeof lib_httpValidation;
  "lib/installations": typeof lib_installations;
  "lib/pushProviders": typeof lib_pushProviders;
  migrations: typeof migrations;
  mobileRegistration: typeof mobileRegistration;
  news: typeof news;
  notifications: typeof notifications;
  profiles: typeof profiles;
  push: typeof push;
  rateLimit: typeof rateLimit;
  seed: typeof seed;
  seedCivic: typeof seedCivic;
  seedTopics: typeof seedTopics;
  subscriptions: typeof subscriptions;
  topics: typeof topics;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
