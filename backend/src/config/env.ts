/**
 * Environment loader
 *
 * Must be imported BEFORE any module that reads `process.env` at load time
 * (e.g. tokenService, database config). Importing this file has the side
 * effect of loading the appropriate `.env` files into `process.env`.
 */

import path from "path";
import dotenv from "dotenv";

const envDirectory = path.resolve(__dirname, "..", "..");
const envFileName =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
      ? ".env.test"
      : ".env.development";

dotenv.config({ path: path.join(envDirectory, envFileName) });
dotenv.config({
  path: path.join(envDirectory, ".env.local"),
  override: true,
});

export {};
