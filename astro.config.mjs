import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mfj0924-lab.github.io',
  base: '/tomme-portfolio',
  output: 'static',
  build: { format: 'directory' },
});
