/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-01 16:26:31
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-06 14:51:03
 * @FilePath: /qiankun/src/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * @author Kuitos
 * @since 2019-04-25
 */

export { loadMicroApp, registerMicroApps, start } from './apis';
export { initGlobalState } from './globalState';
export { getCurrentRunningApp as __internalGetCurrentRunningApp } from './sandbox';
export * from './errorHandler';
export * from './effects';
export * from './interfaces';
export { prefetchImmediately as prefetchApps } from './prefetch';
