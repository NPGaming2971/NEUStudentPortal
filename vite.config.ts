import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

// The app's API calls use relative /portal and /regist paths, which the
// Cloudflare worker (worker.js) proxies to the university APIs on the same
// origin. In dev, run `wrangler dev` instead of `vite dev` to exercise that
// exact path (the worker forges the required Referer header).
// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
