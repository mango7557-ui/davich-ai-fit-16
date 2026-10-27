import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Dynamic OpenGraph / KakaoTalk Scraper Transform Plugin
const dynamicOgPlugin: Plugin = {
  name: 'davich-og-transform',
  transformIndexHtml(html, ctx) {
    const req = (ctx as any).server?.req;
    const rawUrl = (ctx as any).originalUrl || req?.url || ctx.path || '';
    const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || '';
    const proto = req?.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = host ? `${proto}://${host}` : '';
    const absoluteImgUrl = baseUrl ? `${baseUrl}/og-image.png` : '/og-image.png';

    // Inject absolute image URLs required by KakaoTalk & OpenGraph scrapers
    if (baseUrl) {
      html = html.replace(
        /<meta property="og:image" content=".*?" \/>/,
        `<meta property="og:image" content="${absoluteImgUrl}" />`
      );
      html = html.replace(
        /<meta property="og:image:secure_url" content=".*?" \/>/,
        `<meta property="og:image:secure_url" content="${absoluteImgUrl}" />`
      );
      html = html.replace(
        /<meta name="twitter:image" content=".*?" \/>/,
        `<meta name="twitter:image" content="${absoluteImgUrl}" />`
      );
    }

    if (rawUrl.includes('company=')) {
      const match = rawUrl.match(/[?&]company=([^&#]+)/);
      if (match) {
        const rawCode = decodeURIComponent(match[1]).toLowerCase();
        let companyName = '기업별 전용 진단';
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

        const dynamicTitle = `[${companyName}] 임직원 AI 역량 & 16 성향 진단 (DAVICH AI FIT 16)`;
        const dynamicDesc = `16개 업무 성향 진단 및 현장 업무 자동화 설문 참여 (소요시간: 약 10~15분 · 수신 후 1주일 이내 완료)`;

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
          /<meta name="twitter:title" content=".*?" \/>/,
          `<meta name="twitter:title" content="${dynamicTitle}" />`
        );
        html = html.replace(
          /<meta name="twitter:description" content=".*?" \/>/,
          `<meta name="twitter:description" content="${dynamicDesc}" />`
        );
      }
    }
    return html;
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
