// Worker entry for brendantscoggin-site. Static files are served by the assets binding;
// this code runs only for /api/* (assets.run_worker_first) and for the hourly digest cron.
import { handleContact } from "./handler.js";
import { runDigest } from "./digest.js";
import manifest from "../media/animals/manifest.json" with { type: "json" };

export default {
  async fetch(request, env) {
    return handleContact(request, env, new Date(), Math.random, manifest);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDigest(env, new Date()));
  },
};
