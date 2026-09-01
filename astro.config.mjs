import { defineConfig } from 'astro/config';

const isCloudflarePages =
  process.env.CF_PAGES === '1' || process.env.DEPLOY_TARGET === 'cloudflare';

export default defineConfig({
  site: isCloudflarePages
    ? 'https://tomme-portfolio.pages.dev'
    : 'https://mfj0924-lab.github.io',
  base: isCloudflarePages ? '/' : '/tomme-portfolio',
  output: 'static',
  build: { format: 'directory' },
});
