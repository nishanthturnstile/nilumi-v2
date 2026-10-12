module.exports = {
  preset: "jest-expo",
  testMatch: ["**/tests/**/*.test.tsx"],
  moduleNameMapper: {
    "^@nilumi/ui$": "<rootDir>/../../packages/ui/src/index.ts",
  },
  transform: {
    "^.+\\.mjs$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(?:\\.pnpm/|react-native|@react-native|expo|@expo|tamagui|@tamagui|@testing-library|test-renderer))",
  ],
};
