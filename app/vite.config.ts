/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// BASE is set by the GitHub Pages build ("/mineDining/"); "/" everywhere else.
const base = process.env.BASE ?? "/";

export default defineConfig({
	base,
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["icon.svg", "apple-touch-icon.png"],
			manifest: {
				name: "mineDining",
				short_name: "mineDining",
				description: "Recipes as process graphs: follow along hands-busy.",
				theme_color: "#1f6f5c",
				background_color: "#fbfaf7",
				display: "standalone",
				orientation: "portrait",
				start_url: base,
				scope: base,
				icons: [
					{ src: "icon-192.png", sizes: "192x192", type: "image/png" },
					{ src: "icon-512.png", sizes: "512x512", type: "image/png" },
					{ src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,wav}"],
			},
			devOptions: { enabled: false },
		}),
	],
	test: {
		include: ["src/**/*.test.ts"],
	},
});
