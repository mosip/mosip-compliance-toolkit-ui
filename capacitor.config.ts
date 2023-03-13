import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.mosip.compliance.toolkit',
  appName: 'mosip-compliance-toolkit-ui',
  webDir: 'dist/mosip-compliance-toolkit-ui',
  bundledWebRuntime: false,
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
  // server: {
  //   url: 'http://192.168.1.10:4200',
  //   cleartext: true
  // },
};

export default config;
