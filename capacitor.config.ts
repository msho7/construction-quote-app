import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mikes.constructionquote",
  appName: "Construction Quote",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
