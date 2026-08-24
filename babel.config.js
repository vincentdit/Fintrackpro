// The `@/*` path alias is resolved at runtime by Expo's Metro config via
// `experiments.tsconfigPaths` (see app.json) using the paths in tsconfig.json,
// so no extra Babel plugin is required.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
