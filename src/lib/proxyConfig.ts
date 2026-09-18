/**
 * Shared API base URLs — content of cloudflare-worker/worker.js.
 * Worker serves the SPA from dist/ AND proxies /portal and /regist
 * on the same origin, so these live at relative paths.
 */
export const PORTAL_PROXY_URL = "/portal";

export const REGIST_PROXY_URL = "/regist";
