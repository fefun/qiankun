## forked from [qiankun](https://github.com/umijs/qiankun)

Thanks to the author of qiankun, please check the [official website](https://qiankun.umijs.org/zh/guide) for the instructions for use of qiankun

## added features

1. support htmlcontent microapps

```js
registerMicroApps(
  [
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
            mount: () => {
              console.log('purehtml mount');
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
      container: '#subapp-viewport',
      activeRule: '/htmldoc',
    },
    ...
  ],
  {
    beforeLoad: ...,
    beforeMount: ...,
    afterUnmount: ...,
  },
);
```

or

```js
loadMicroApp(
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
            mount: () => {
              console.log('purehtml mount');
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
```
