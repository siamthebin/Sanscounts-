import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sanscounts.app',
  appName: 'Sanscounts',
  webDir: 'dist',
  server: {
    url: 'https://sanscounts.sansloud.com',
    cleartext: true
  }
};

export default config;
