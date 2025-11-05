const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../node_modules'),
      }),
      nodeExternals(),
    ],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    resolve: {
      ...options.resolve,
      plugins: [
        ...(options.resolve?.plugins || []),
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, 'tsconfig.build.json'),
        }),
      ],
    },
  };
};
