module.exports = {
  preset: "jest-expo",
  testMatch: ["**/tests/**/*.test.tsx"],
  transform: {
    "^.+\\.mjs$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(?:\\.pnpm/)?(?:react-native|@react-native|expo|@expo|tamagui|@tamagui|@testing-library|test-renderer|better-auth|@better-auth|@better-fetch|nanostores))",
  ],
};
