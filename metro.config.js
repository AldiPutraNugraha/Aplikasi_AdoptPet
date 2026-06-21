// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-native-maps has native-only code that can't bundle for web.
// Alias it to a no-op module so web builds succeed.
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
];

config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;
