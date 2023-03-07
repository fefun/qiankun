/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-01 16:26:31
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-07 15:46:14
 * @FilePath: /qiankun/examples/purehtml/entry.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import MicroCard from '../../dist/esm/microCard';

const render = ($) => {
  $('#purehtml-container').html('Hello, render with jQuery');
  // microcard event
  $('.btns').on('click', 'span', function () {
    let id = $(this).parent().data('id');
    let act = $(this).data('act');
    let cf = cards[id];
    let app = cf.app;
    let st = cf.app.getState();
    switch (act) {
      case 'add':
        app.setState({ count: (st.count || 0) + 1 });
        break;
      case 'del':
        app.setState({ count: (st.count || 0) - 1 });
        break;
      case 'mount':
        if (id === 'card_5') {
          app.load('//localhost:7104/card.html').setState({ count: 0 });
        } else {
          app.loadContent(genRawHtml(id)).setState({ count: 0 });
        }
        break;
      case 'unmount':
        app.unmount();
        break;
    }
  });

  loadCards();

  return Promise.resolve();
};

function genRawHtml(id) {
  let idx = Number(id.replace(/[^\d]/g, ''));
  console.log(id, idx);
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>htmldoc Example</title>
    <script src="//cdn.bootcss.com/jquery/3.4.1/jquery.min.js">
    </script>
    <script>
    const render = ($, container, state) => {
      $(container).find("#count").text("count: " + state.count)
      return Promise.resolve();
    };
    console.log('__POWERED_BY_QIANKUN__', window.__POWERED_BY_QIANKUN__);
    (global => {
      global['__entry__'] = {
        mount: ({container, state}) => {
          console.log('purehtml mount ${id}', state);
          return render($, container, state);
        },
        unmount: ({container, state}) => {
          console.log('purehtml unmount ${id}', state);
          return Promise.resolve();
        },
        update: ({container, state, prevState, dispatch}) => {
          console.log('purehtml update ${id}', state, prevState);
          setTimeout(()=>{
            dispatch('childMessage', {childId: '${id}' , date: new Date()})
          }, 1000)
          return render($, container, state);
        },
      };
    })(window);
    </script>
    <style>
    .box{
      border: solid 1px #dddddd;
      background: rgb(${255 - idx * 30}, ${idx * 30}, 0);
      width: 500px;
      height: 100px;
    }
    </style>
  </head>
  <body>
    <div class="box">
      Example ${id}
      <p>create time ${new Date()}</p>
      <div id="count">count: </div>
    </div>
  </body>
  </html>`;
}
var cards = {};

function loadCards() {
  for (let i = 1; i < 6; i++) {
    let id = 'card_' + i;
    let raw = genRawHtml(id);
    let conf = {
      id: id,
      raw: raw,
      reRawedTimes: 0,
    };
    let appIns;
    if (i === 5) {
      appIns = new MicroCard({ name: conf.id, container: '#' + conf.id })
        .setState({ count: 0 })
        .load('//localhost:7104/card.html');
    } else {
      appIns = new MicroCard({ name: conf.id, container: '#' + conf.id }).setState({ count: 0 }).loadContent(conf.raw);
    }
    conf.app = appIns;
    appIns.on('childMessage', (data) => {
      console.log('data from child:', data);
    });
    cards[conf.id] = conf;
  }
  console.log(cards);
}
function unloadCards() {
  Object.values(cards).forEach((conf) => {
    conf.app && conf.app.unmount();
  });
}

((global) => {
  global['microcard'] = {
    bootstrap: () => {
      console.log('microcard bootstrap');
      return Promise.resolve();
    },
    mount: () => {
      return render($);
    },
    unmount: () => {
      console.log('microcard unmount');
      unloadCards();
      return Promise.resolve();
    },
  };
})(window);

if (!window.__POWERED_BY_QIANKUN__) {
  render($);
}
