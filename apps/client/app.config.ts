import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Nilumi Development",
  slug: "nilumi-development",
  version: "0.0.0",
  scheme: "nilumi-dev",
  orientation: "default",
  userInterfaceStyle: "automatic",
  icon: "./assets/template/icon.png",
  android: {
    package: "dev.nilumi.shell",
    adaptiveIcon: {
      foregroundImage: "./assets/template/android-icon-foreground.png",
      backgroundColor: "#F5F1EE",
    },
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/template/favicon.png" },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-font",
    [
      "expo-splash-screen",
      { backgroundColor: "#F5F1EE", image: "./assets/template/splash-icon.png", imageWidth: 120 },
    ],
    "./plugins/with-windows-cxx-staging.cjs",
  ],
};
export default config;
