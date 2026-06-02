import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: [] })],
    build: {
      outDir: 'release/app/dist/main',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main/main.ts'),
        },
        external: ['keytar', 're2'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'release/app/dist/preload',
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'src/main/preload.ts'),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      outDir: resolve(__dirname, 'release/app/dist/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html'),
        output: {
          format: 'es',
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      assetsInlineLimit: 0,
    },
    plugins: [
      react(),
      ...(isDev ? [] : [
        viteStaticCopy({
          targets: [
            {
              src: 'images/**/*',
              dest: 'images'
            }
          ]
        })
      ])
    ],
    server: {
      port: 5175,
      strictPort: false,
      fs: {
        strict: false,
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        'renderer': resolve(__dirname, 'src/renderer'),
      },
    },
    define: {
      'global': 'globalThis',
    },
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
  },
});
