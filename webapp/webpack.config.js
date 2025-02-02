const path = require('path');

module.exports = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, '../app/static'),
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env"], // ensure compatibility with older browsers
            plugins: ["@babel/plugin-transform-object-assign"], // ensure compatibility with IE 11
          },
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    fallback: {
      "events": require.resolve("events/"),
      "util": require.resolve("util/")
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve HTML from 'public' folder
    },
    compress: true,
    port: 8080
  },
  mode: 'development'
};
