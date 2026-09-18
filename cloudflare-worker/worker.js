const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, apikey, clientid, accept",
};

const API_TARGETS = {
	portal: "https://daotao-api.neu.edu.vn/api",
	regist: "https://tinchi-api.neu.edu.vn/api",
};

// Headers to skip when forwarding
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
];

export default {
	async fetch(request, env, ctx) {
		// Handle preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: CORS_HEADERS,
			});
		}

		const url = new URL(request.url);
		const pathname = url.pathname;

		// Determine target API
		let targetBase = "";
		let newPath = "";

		if (pathname.startsWith("/portal")) {
			targetBase = API_TARGETS.portal;
			newPath = pathname.replace("/portal", "");
		} else if (pathname.startsWith("/regist")) {
			targetBase = API_TARGETS.regist;
			newPath = pathname.replace("/regist", "");
		} else {
			return new Response(
				JSON.stringify({error: "Invalid path. Use /portal or /regist"}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
						...CORS_HEADERS,
					},
				},
			);
		}

		// Build target URL
		const targetUrl = `${targetBase}${newPath}${url.search}`;

		// Clone headers and forward (skip problematic ones)
		const headers = new Headers();
		for (const [key, value] of request.headers) {
			if (!SKIP_HEADERS.includes(key.toLowerCase())) {
				headers.set(key, value);
			}
		}

		// Set a proper User-Agent
		headers.set(
			"User-Agent",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		);
		headers.set("Accept", "application/json, text/plain, */*");

		// Forge the Referer the upstream API requires (it returns 400 otherwise)
		headers.set("Referer", "https://nguoihoc.neu.edu.vn/");

		try {
			// Read body for POST/PUT requests
			let body = null;
			if (request.method !== "GET" && request.method !== "HEAD") {
				body = await request.text();
			}

			// Forward the request with cf options to avoid some edge behaviors
			const response = await fetch(targetUrl, {
				method: request.method,
				headers: headers,
				body: body,
				cf: {
					// Disable caching
					cacheTtl: 0,
					cacheEverything: false,
				},
			});

			// Get response body
			const responseBody = await response.text();

			// Clone response and add CORS headers
			const responseHeaders = new Headers(response.headers);
			for (const [key, value] of Object.entries(CORS_HEADERS)) {
				responseHeaders.set(key, value);
			}

			return new Response(responseBody, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({error: error.message, stack: error.stack}),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
						...CORS_HEADERS,
					},
				},
			);
		}
	},
};
