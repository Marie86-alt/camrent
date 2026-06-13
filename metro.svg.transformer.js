// Chains react-native-svg-transformer (for .svg files) with the
// NativeWind/Expo babel transformer (for everything else).
const path = require('path');
const svgTransformer = require('react-native-svg-transformer');

// Resolve the same transformer that withNativeWind uses (expo's nested copy).
const expoDir = path.dirname(require.resolve('expo/package.json'));
const expoTransformerPath = path.join(
  expoDir,
  'node_modules/@expo/metro-config/build/babel-transformer.js'
);
const expoTransformer = require(expoTransformerPath);

module.exports.transform = function transform(props) {
  if (props.filename.endsWith('.svg')) {
    return svgTransformer.transform(props);
  }
  return expoTransformer.transform(props);
};
