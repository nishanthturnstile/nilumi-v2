import { defaultConfig } from "@tamagui/config/v6";
import { createTamagui } from "tamagui";

// Keep v3's complete font, radius, spacing and control-sizing definitions.
// Nilumi's product tokens and licensed fonts are a separate foundation task.
export const config = createTamagui({
  ...defaultConfig,
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false },
});
