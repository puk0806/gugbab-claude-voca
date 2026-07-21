import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // RELAY_URL·RELAY_SECRET 은 VITE_ 접두사 없음 — 번들에 노출 금지.
  // dev 서버(Node 프로세스)만 읽어 프록시 헤더로 주입한다. (.env.local)
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'development' && !(env.RELAY_URL && env.RELAY_SECRET)) {
    // dev 설정 누락 진단 — 미설정 시 /api/chat 이 소리없이 404 나는 것 방지
    console.warn(
      '[vite] RELAY_URL/RELAY_SECRET 미설정 — /api/chat 프록시 비활성 (대화 연습 동작 안 함, .env.example 참고)',
    );
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        manifest: {
          name: 'gugbab-voca',
          short_name: 'gugbab',
          description: 'CEFR 영어 회화 단어·문장 학습',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          lang: 'ko',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json}'],
          navigateFallback: '/index.html',
          // vercel.json rewrite 제외와 동일하게 SW 레이어에서도 /api 는 SPA 셸로 안 돌린다
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: false,
      // 로컬 개발용 relay 프록시 — production 은 Vercel 서버리스 함수(api/chat.ts)가 담당
      proxy:
        env.RELAY_URL && env.RELAY_SECRET
          ? {
              '/api/chat': {
                target: env.RELAY_URL,
                changeOrigin: true,
                headers: { 'X-Relay-Secret': env.RELAY_SECRET },
              },
            }
          : undefined,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      outDir: 'dist',
    },
  };
});
