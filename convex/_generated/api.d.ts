/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as engines_battleship from "../engines/battleship.js";
import type * as engines_checkers from "../engines/checkers.js";
import type * as engines_chess from "../engines/chess.js";
import type * as engines_connect4 from "../engines/connect4.js";
import type * as engines_hangman from "../engines/hangman.js";
import type * as engines_index from "../engines/index.js";
import type * as engines_ticTacToe from "../engines/ticTacToe.js";
import type * as groups from "../groups.js";
import type * as leaderboard from "../leaderboard.js";
import type * as rooms from "../rooms.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "engines/battleship": typeof engines_battleship;
  "engines/checkers": typeof engines_checkers;
  "engines/chess": typeof engines_chess;
  "engines/connect4": typeof engines_connect4;
  "engines/hangman": typeof engines_hangman;
  "engines/index": typeof engines_index;
  "engines/ticTacToe": typeof engines_ticTacToe;
  groups: typeof groups;
  leaderboard: typeof leaderboard;
  rooms: typeof rooms;
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
