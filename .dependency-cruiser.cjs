module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    { name: "no-unresolved", severity: "error", from: {}, to: { couldNotResolve: true } },
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    preserveSymlinks: false,
    enhancedResolveOptions: {
      conditionNames: ["types", "import", "react-native", "default"],
      exportsFields: ["exports"],
      extensions: [".ts", ".tsx", ".d.ts", ".js", ".mjs", ".cjs"],
    },
  },
};
