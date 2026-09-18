import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "https://daotao-api.neu.edu.vn",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/regist": {
				target: "https://tinchi-api.neu.edu.vn",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/regist/, "/api"),
			},
		},
	},
});
