/**
 * Single Cloudflare Worker.
 * - Serves the SPA from dist/ (via the ASSETS binding, SPA fallback).
 * - Proxies /portal/* -> https://daotao-api.neu.edu.vn/api/*
 *        and /regist/* -> https://tinchi-api.neu.edu.vn/api/*
 *   Same origin as the frontend, so NO CORS needed.
 *
 * The universities' APIs reject (400) any request whose Referer is not from
 * nguoihoc.neu.edu.vn, so this worker strips the browser's Referer and forges
 * its own before forwarding.
 */

const API_TARGETS = {
	portal: "https://daotao-api.neu.edu.vn/api",
	regist: "https://tinchi-api.neu.edu.vn/api",
};

// Headers not forwarded to the upstream APIs
const SKIP_HEADERS = [
	"host",
	"origin",
	"referer",
	"cf-connecting-ip",
	"cf-ipcountry",
	"cf-ray",
	"cf-visitor",
	"x-forwarded-for",
	"x-forwarded-proto",
	"x-real-ip",
	"connection",
	"keep-alive",
	"transfer-encoding",
	"content-length",
];

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// ---- Proxy /portal and /regist to the university APIs ----
		let targetBase = "";
		let newPath = "";

		if (pathname.startsWith("/portal")) {
			targetBase = API_TARGETS.portal;
			newPath = pathname.replace("/portal", "");
		} else if (pathname.startsWith("/regist")) {
			targetBase = API_TARGETS.regist;
			newPath = pathname.replace("/regist", "");
		}

		if (targetBase) {
			const targetUrl = `${targetBase}${newPath}${url.search}`;

			const headers = new Headers();
			for (const [key, value] of request.headers) {
				if (!SKIP_HEADERS.includes(key.toLowerCase())) {
					headers.set(key, value);
				}
			}
			headers.set(
				"User-Agent",
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			);
			headers.set("Accept", "application/json, text/plain, */*");

			// Forge the Referer the upstream APIs demand (they return 400 otherwise)
			headers.set("Referer", "https://nguoihoc.neu.edu.vn/");

			let body = null;
			if (request.method !== "GET" && request.method !== "HEAD") {
				body = await request.text();
			}

			try {
				const response = await fetch(targetUrl, {
					method: request.method,
					headers,
					body,
					cf: { cacheTtl: 0, cacheEverything: false },
				});
				const responseBody = await response.text();
				return new Response(responseBody, {
					status: response.status,
					statusText: response.statusText,
					headers: response.headers,
				});
			} catch (error) {
				return new Response(
					JSON.stringify({ error: error.message, stack: error.stack }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// ---- Fall through to the SPA static assets ----
		return env.ASSETS.fetch(request);
	},
};
