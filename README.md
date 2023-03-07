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

2. micro card

```js
new MicroCard({ name: name, container: container }).setState({ count: 0 }).loadContent(htmltext); // load html raw text content
// .load(http url)  // or load http url content
```

html content use `global.__entry__` to export lifecycle hooks

```html
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="//cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
    <script>
      const render = ($, container, state) => {
        $(container)
          .find('#count')
          .text('count: ' + state.count);
        return Promise.resolve();
      };

      ((global) => {
        // important
        global['__entry__'] = {
          mount: ({ container, state }) => {
            console.log('purehtml mount ${id}', state);
            return render($, container, state);
          },
          unmount: ({ container, state }) => {
            console.log('purehtml unmount ${id}', state);
            return Promise.resolve();
          },
          update: ({ container, state, prevState, dispatch }) => {
            console.log('purehtml update ${id}', state, prevState);
            setTimeout(() => {
              dispatch('childMessage', { childId: '${id}', date: new Date() });
            }, 1000);
            return render($, container, state);
          },
        };
      })(window);
    </script>
    <style>
      .box {
        width: 500px;
        height: 100px;
        background: rgb(${255 - idx * 30}, ${idx * 30}, 0);
        border: solid 1px #dddddd;
      }
    </style>
  </head>
  <body>
    <div class="box">
      Example ${id}
      <p>create time ${new Date()}</p>
      <div id="count">count:</div>
    </div>
  </body>
</html>
```
