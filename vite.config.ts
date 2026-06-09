import { defineConfig } from 'vite';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      pngquant: { quality: [0.6, 0.8] },
      svgo: {},
    }),
  ],
});