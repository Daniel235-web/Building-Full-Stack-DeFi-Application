module.exports = {
  // ...existing config...
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: /node_modules/
      },
      // ...other rules...
    ]
  }
}