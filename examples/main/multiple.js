/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-01 16:26:31
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-02 13:08:39
 * @FilePath: /qiankun/examples/main/multiple.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { loadMicroApp, initGlobalState } from '../../dist/esm';
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  user: 'qiankun',
});

setGlobalState({
  app1: {
    data: [1,2,3]
  },
  app2: {
    data: [4,5,6]
  }
})
let app;

function mount() {
  // app = loadMicroApp(
  //   { name: 'react15', entry: '//localhost:7102', container: '#react15' },
  //   { sandbox: { experimentalStyleIsolation: true } },
  // );
  app = loadMicroApp(
    {
      name: 'htmldoc',
      entryContent: `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>htmldoc Example</title>
        <script src="//cdn.bootcss.com/jquery/3.4.1/jquery.min.js">
        </script>
        <script>
        const render = $ => {
          $('#purehtml-container').html('Hello, render with jQuery');
          return Promise.resolve();
        };
        
        (global => {
          global['htmldoc'] = {
            bootstrap: () => {
              console.log('purehtml bootstrap');
              return Promise.resolve();
            },
            mount: (props) => {
              console.log('purehtml mount', props);
              return render($);
            },
            unmount: () => {
              console.log('purehtml unmount');
              return Promise.resolve();
            },
          };
        })(window);
        </script>
        <style>
        body{
          color: red;
        }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
          Purehtmlcontent Example
        </div>
        <div id="purehtml-container" style="text-align:center"></div>
      </body>
      </html>`,
      container: '#react15',
    },
    { sandbox: { experimentalStyleIsolation: true } },
  );
}

function unmount() {
  app.unmount();
}

document.querySelector('#mount').addEventListener('click', mount);
document.querySelector('#unmount').addEventListener('click', unmount);

loadMicroApp({ name: 'vue', entry: '//localhost:7101', container: '#vue' });
