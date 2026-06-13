const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Let NativeWind apply its transformer first.
const nwConfig = withNativeWind(config, { input: './global.css' });

// 2. Then override babelTransformerPath with our chained transformer
//    (SVG → react-native-svg-transformer, everything else → NW/Expo transformer).
nwConfig.transformer = {
  ...nwConfig.transformer,
  babelTransformerPath: path.resolve(__dirname, 'metro.svg.transformer.js'),
};

// 3. Move svg from assets to source extensions so Metro compiles it.
nwConfig.resolver = {
  ...nwConfig.resolver,
  assetExts: nwConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...nwConfig.resolver.sourceExts, 'svg'],
};

module.exports = nwConfig;
