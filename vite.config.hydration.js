import { defineConfig } from 'vite'
import postcssNesting from 'postcss-nesting'

export default defineConfig({
    define: {
        global: 'globalThis'
    },
    root: 'example-hydration',
    plugins: [],
    esbuild: {
        logOverride: {
            'this-is-undefined-in-esm': 'silent'
        }
    },
    css: {
        postcss: {
            plugins: [
                postcssNesting
            ],
        },
    },
    server: {
        port: 8889,
        host: true,
        open: true,
    },
    build: {
        minify: false,
        outDir: '../public-hydration',
        emptyOutDir: true,
        sourcemap: 'inline'
    }
})
