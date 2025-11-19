/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as awards from "../awards.js";
import type * as cats from "../cats.js";
import type * as contact from "../contact.js";
import type * as cron from "../cron.js";
import type * as files from "../files.js";
import type * as gallery from "../gallery.js";
import type * as heroImages from "../heroImages.js";
import type * as heroVideos from "../heroVideos.js";
import type * as imageMigration from "../imageMigration.js";
import type * as pedigree from "../pedigree.js";
import type * as seed from "../seed.js";
import type * as siteSettings from "../siteSettings.js";
import type * as tiktokVideos from "../tiktokVideos.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  announcements: typeof announcements;
  auth: typeof auth;
  awards: typeof awards;
  cats: typeof cats;
  contact: typeof contact;
  cron: typeof cron;
  files: typeof files;
  gallery: typeof gallery;
  heroImages: typeof heroImages;
  heroVideos: typeof heroVideos;
  imageMigration: typeof imageMigration;
  pedigree: typeof pedigree;
  seed: typeof seed;
  siteSettings: typeof siteSettings;
  tiktokVideos: typeof tiktokVideos;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
