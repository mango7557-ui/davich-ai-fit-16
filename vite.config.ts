import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const PREBUILT_COMPANIES = [
  { code: 'davich-hq', name: '다비치안경 본사' },
  { code: 'store-gangnam', name: '다비치안경 강남점' },
  { code: 'store-daechi', name: '다비치안경 대치본점' },
  { code: 'davich-sx7r', name: '다비치안경 명동점' },
];

// Dynamic OpenGraph / KakaoTalk Scraper Transform Plugin + Static Per-Company OG Page Generator
const dynamicOgPlugin: Plugin = {
  name: 'davich-og-transform',
  transformIndexHtml(html, ctx) {
    const req = (ctx as any).server?.req;
    const rawUrl = (ctx as any).originalUrl || req?.url || ctx.path || '';
    const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || '';
    const proto = req?.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = host ? `${proto}://${host}` : '';

    if (rawUrl.includes('company=') || rawUrl.includes('name=')) {
      const codeMatch = rawUrl.match(/[?&]company=([^&#]+)/);
      const nameMatch = rawUrl.match(/[?&]name=([^&#]+)/);
      const rawCode = codeMatch ? decodeURIComponent(codeMatch[1]).toLowerCase() : '';
      let companyName = nameMatch ? decodeURIComponent(nameMatch[1]).trim() : '';

      if (!companyName && rawCode) {
        if (rawCode.includes('myeongdong') || rawCode === 'davich-sx7r') {
          companyName = '다비치안경 명동점';
        } else if (rawCode.includes('gangnam')) {
          companyName = '다비치안경 강남점';
        } else if (rawCode.includes('daechi')) {
          companyName = '다비치안경 대치본점';
        } else if (rawCode.includes('hq')) {
          companyName = '다비치안경 본사';
        } else {
          const cleanName = rawCode.replace(/^store-|^comp-|^davich-/, '').replace(/-/g, ' ');
          companyName = `다비치안경 ${cleanName}`;
        }
      }

      if (companyName) {
        const dynamicTitle = `${companyName} AI 역량 & 16 성향 진단`;
        const dynamicDesc = `${companyName} 임직원 전용 AI 역량 & 16 성향 진단 (DAVICH AI FIT 16)`;
        const isPrebuilt = PREBUILT_COMPANIES.some((c) => c.code === rawCode);
        const ogFile = isPrebuilt ? `og-${rawCode}.png` : 'og-image.png';
        const absoluteImgUrl = baseUrl ? `${baseUrl}/${ogFile}` : `/${ogFile}`;

        html = html.replace(/<title>.*?<\/title>/, `<title>${dynamicTitle}</title>`);
        html = html.replace(
          /<meta property="og:title" content=".*?" \/>/,
          `<meta property="og:title" content="${dynamicTitle}" />`
        );
        html = html.replace(
          /<meta property="og:description" content=".*?" \/>/,
          `<meta property="og:description" content="${dynamicDesc}" />`
        );
        html = html.replace(
          /<meta property="og:image" content=".*?" \/>/,
          `<meta property="og:image" content="${absoluteImgUrl}" />`
        );
        html = html.replace(
          /<meta property="og:image:secure_url" content=".*?" \/>/,
          `<meta property="og:image:secure_url" content="${absoluteImgUrl}" />`
        );
        html = html.replace(
          /<meta name="twitter:title" content=".*?" \/>/,
          `<meta name="twitter:title" content="${dynamicTitle}" />`
        );
        html = html.replace(
          /<meta name="twitter:description" content=".*?" \/>/,
          `<meta name="twitter:description" content="${dynamicDesc}" />`
        );
        html = html.replace(
          /<meta name="twitter:image" content=".*?" \/>/,
          `<meta name="twitter:image" content="${absoluteImgUrl}" />`
        );
      }
    }
    return html;
  },
  closeBundle() {
    // Generate static per-company OG pages in dist/<company.code>/index.html for KakaoTalk scrapers
    const distDir = path.resolve(import.meta.dirname, 'dist');
    const indexHtmlPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) return;

    const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const ghPagesBase = 'https://mango7557-ui.github.io/davich-ai-fit-16';

    for (const comp of PREBUILT_COMPANIES) {
      const compDir = path.join(distDir, comp.code);
      fs.mkdirSync(compDir, { recursive: true });

      const compTitle = `${comp.name} AI 역량 & 16 성향 진단`;
      const compDesc = `${comp.name} 임직원 전용 AI 역량 & 16 성향 진단 (DAVICH AI FIT 16)`;
      const compImgUrl = `${ghPagesBase}/og-${comp.code}.png`;

      let compHtml = baseHtml
        .replace('<head>', '<head>\n    <base href="../" />')
        .replace(/<title>.*?<\/title>/, `<title>${compTitle}</title>`)
        .replace(
          /<meta property="og:title" content=".*?" \/>/,
          `<meta property="og:title" content="${compTitle}" />`
        )
        .replace(
          /<meta property="og:description" content=".*?" \/>/,
          `<meta property="og:description" content="${compDesc}" />`
        )
        .replace(
          /<meta property="og:image" content=".*?" \/>/,
          `<meta property="og:image" content="${compImgUrl}" />`
        )
        .replace(
          /<meta property="og:image:secure_url" content=".*?" \/>/,
          `<meta property="og:image:secure_url" content="${compImgUrl}" />`
        )
        .replace(
          /<meta name="twitter:title" content=".*?" \/>/,
          `<meta name="twitter:title" content="${compTitle}" />`
        )
        .replace(
          /<meta name="twitter:description" content=".*?" \/>/,
          `<meta name="twitter:description" content="${compDesc}" />`
        )
        .replace(
          /<meta name="twitter:image" content=".*?" \/>/,
          `<meta name="twitter:image" content="${compImgUrl}" />`
        );

      fs.writeFileSync(path.join(compDir, 'index.html'), compHtml, 'utf8');
    }
  },
};

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), dynamicOgPlugin],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
