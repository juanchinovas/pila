import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    base: process.env.CI ? '/pila/' : '/',
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        watch: {
            usePolling: true,
        },
    },
});
