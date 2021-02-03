const path = require("path");

/** @type {import('webpack').Configuration} */
module.exports = {
  target: "node",
  entry: "./src/extension.ts",
  output: {
    path: path.join(__dirname, "out"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".ts", "json"],
    alias: {
      "@utils": path.resolve(__dirname, "src/utils/"),
    }
  },
  externals: {
    vscode: "commonjs vscode",
    fsevents: "require('fsevents')"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        // exclude: /node_modules/,
        use: [{
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            
          }
        }]
      }
    ]
  },
  optimization: {
    // minimize: true,
  }
};