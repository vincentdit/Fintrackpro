// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Expo SDK 54 enables Metro "package exports" resolution, which makes Metro
 * pick zustand's ESM build. That build uses `import.meta.env`, and on web the
 * bundle is loaded as a classic script where `import.meta` is a syntax error,
 * so the whole app fails to boot (blank page). Native is unaffected.
 *
 * Fix surgically: force ONLY zustand to resolve to its CommonJS entry (no
 * import.meta) via Node's own resolution. Every other package keeps the
 * default resolution, so nothing else — including the working native build —
 * changes.
 */
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName) };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = config;
