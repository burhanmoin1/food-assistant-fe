import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				ws: true
			},
			'/socket.io': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				ws: true
			},
			'/admin': {
				target: 'http://localhost:8000', // Keep pointing to Django for admin if running
				changeOrigin: true
			}
		}
	}
});
