import type { CapacitorConfig } from '@capacitor/cli';

const isProduction = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.pullim.app',
  appName: '풀림',
  webDir: 'out',
  server: isProduction
    ? { url: 'https://pullim.vercel.app' }
    : { url: 'http://localhost:3000', cleartext: true },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pullim',
  },
};

export default config;
