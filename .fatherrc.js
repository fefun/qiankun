/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-01 13:52:52
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-02 14:25:42
 * @FilePath: /qiankun/.fatherrc.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { version } from './package.json';
// import globals from 'globals';

import { defineConfig } from 'father';

// generate version.ts
const versionFilePath = join(__dirname, './src/version.ts');
writeFileSync(versionFilePath, `export const version = '${version}';\n`);

// generate globals.ts
// const globalsFilePath = join(__dirname, './src/sandbox/globals.ts');
// writeFileSync(
//   globalsFilePath,
//   `// generated from https://github.com/sindresorhus/globals/blob/main/globals.json es2015 part
// // only init its values while Proxy is supported
// export const globals = window.Proxy ? ${JSON.stringify(
//     Object.keys(globals.es2015),
//     null,
//     2,
//   )}.filter(p => /* just keep the available properties in current window context */ p in window) : [];`,
// );

export default defineConfig({
  // 以下为 esm 配置项启用时的默认值，有自定义需求时才需配置
  esm: {
    input: 'src', // 默认编译目录
    platform: 'browser', // 默认构建为 Browser 环境的产物
    transformer: 'babel', // 默认使用 babel 以提供更好的兼容性
  },
  // 以下为 cjs 配置项启用时的默认值，有自定义需求时才需配置
  cjs: {
    input: 'src', // 默认编译目录
    platform: 'node', // 默认构建为 Node.js 环境的产物
    transformer: 'esbuild', // 默认使用 esbuild 以获得更快的构建速度
  },
  // 以下为 umd 配置项启用时的默认值，有自定义需求时才需配置
  umd: {
    entry: 'src/index', // 默认构建入口文件
  },
  // targets: { browser: { ie: 11 } },
  // esm: 'babel',
  // cjs: 'babel',
  // umd: {
  //   minFile: true,
  //   sourcemap: true,
  // },
  // runtimeHelpers: true,
  extraBabelPlugins: [
    [
      'babel-plugin-import',
      {
        libraryName: 'lodash',
        libraryDirectory: '',
        camel2DashComponentName: false,
      },
    ],
  ],
});
