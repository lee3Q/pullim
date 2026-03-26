import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pullim.app',
  appName: '풀림',
  webDir: 'out',
  server: {
    // 개발: localhost, 배포 후: Vercel URL로 교체
    url: 'http://localhost:3000',
    cleartext: true, // HTTP 허용 (개발용)
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pullim',
  },
};

export default config;
