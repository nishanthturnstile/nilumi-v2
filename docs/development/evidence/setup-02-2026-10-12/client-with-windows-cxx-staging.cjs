const { withAppBuildGradle } = require("expo/config-plugins");
module.exports = function withWindowsCxxStaging(config) {
  return withAppBuildGradle(config, (result) => {
    const marker = "// Nilumi Windows CMake staging qualification";
    if (!result.modResults.contents.includes(marker)) {
      result.modResults.contents += `
${marker}
def nilumiWindowsCxxDir = project.findProperty('nilumiWindowsCxxDir')
if (System.getProperty('os.name').startsWith('Windows') && nilumiWindowsCxxDir) {
    android.externalNativeBuild.cmake.buildStagingDirectory = file(nilumiWindowsCxxDir)
}
`;
    }
    return result;
  });
};
