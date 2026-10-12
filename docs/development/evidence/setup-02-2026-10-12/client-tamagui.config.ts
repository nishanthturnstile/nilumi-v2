import { createFont, createTamagui, createTokens } from "tamagui";

const font = createFont({
  family: "System",
  size: { true: 18, 1: 14, 2: 18, 3: 24 },
  lineHeight: { true: 26, 1: 20, 2: 26, 3: 32 },
  weight: { true: "400", 1: "400", 2: "600" },
  letterSpacing: { true: 0, 1: 0, 2: 0 },
});
export const config = createTamagui({
  tokens: createTokens({
    color: { ink: "#253447", surface: "#fffdf7", accent: "#366851" },
    space: { 0: 0, 1: 8, 2: 16, 3: 24, true: 16 },
    size: { 0: 0, 1: 32, 2: 44, 3: 64, true: 44 },
    radius: { 0: 0, 1: 8, 2: 12, true: 8 },
    zIndex: { 0: 0, 1: 1, true: 1 },
  }),
  themes: {
    light: { background: "#fffdf7", color: "#253447", borderColor: "#366851" },
  },
  fonts: { body: font, heading: font },
});
