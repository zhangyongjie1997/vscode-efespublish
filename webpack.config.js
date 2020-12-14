"@ts-check";
"use strict";

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
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".js", ".ts", "json"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: "ts-loader",
        }]
      }
    ]
  },
  optimization: {
    minimize: true,
  }
};