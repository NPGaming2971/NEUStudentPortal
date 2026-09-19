/**
 * Shared API base URLs — content of cloudflare-worker/worker.js.
 * Worker serves the SPA from dist/ AND proxies /portal and /regist
 * on the same origin, so these live at relative paths.
 */
export const PORTAL_PROXY_URL = "/portal";

export const REGIST_PROXY_URL = "/regist";

export const PORTAL_API_KEY = "neucqpscrbf0zt2mqo6vmw69ymoh43irb2rtxbs0ehit2kzvl2auxafjbvw==";

export const REGIST_API_KEY = "pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzv";

export const PORTAL_CLIENT_ID = "neucq";

export const REGIST_CLIENT_ID = "dtl"
