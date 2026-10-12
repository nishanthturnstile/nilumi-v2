import { defaultConfig } from "@tamagui/config/v6";
import { createTamagui } from "tamagui";
import { catalogue } from "./tokens";

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    radius: { ...defaultConfig.tokens.radius, sm: 12, md: 16, lg: 20, xl: 28 },
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: catalogue.light["linen-floor"],
      color: catalogue.light.ink,
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: catalogue.dark["linen-floor"],
      color: catalogue.dark.ink,
    },
  },
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false },
});

type Configuration = typeof tamaguiConfig;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Configuration {}
}
