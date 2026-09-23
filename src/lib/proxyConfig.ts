/**
 * Shared API base URLs — content of cloudflare-worker/worker.js.
 * Worker serves the SPA from dist/ AND proxies /portal and /regist
 * on the same origin, so these live at relative paths.
 * Env vars (VITE_API_URL / VITE_API_KEY) override the defaults in dev.
 */
export const PortalProxyUrl = import.meta.env.VITE_API_URL || '/portal';

export const RegistProxyUrl = import.meta.env.VITE_REGIST_URL || '/regist';

export const PortalApiKey =
	import.meta.env.VITE_API_KEY || 'neucqpscrbf0zt2mqo6vmw69ymoh43irb2rtxbs0ehit2kzvl2auxafjbvw==';

export const RegistApiKey = 'pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzv';

export const PortalClientId = 'neucq';
