/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-06 16:52:57
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-06 16:53:03
 * @FilePath: /qiankun/examples/microcard/webpack.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { name } = require('./package');

module.exports = {
  entry:'./entry.js',
  devtool: 'source-map',
  devServer: {
    open: true,
    port: '7107',
    clientLogLevel: 'warning',
    disableHostCheck: true,
    compress: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    historyApiFallback: true,
    overlay: { warnings: false, errors: true },
  },
  output: {
    publicPath: '/',
  },
  mode: 'development',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-react-jsx'],
          },
        },
      },
      {
        test: /\.(le|c)ss$/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: process.env.MODE === 'multiple' ? './multiple.html' : './index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
  ],
};
