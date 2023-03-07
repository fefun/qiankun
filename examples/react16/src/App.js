/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-01 16:26:31
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-06 16:21:56
 * @FilePath: /qiankun/examples/react16/src/App.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import { Divider } from 'antd';

import 'antd/dist/antd.min.css';
import './App.css';

import LibVersion from './components/LibVersion';
import HelloModal from './components/HelloModal';

import Home from './pages/Home';
const About = lazy(() => import('./pages/About'));

const RouteExample = () => {
  return (
    <Router basename={window.__POWERED_BY_QIANKUN__ ? '/react16' : '/'}>
      <nav>
        <Link to="/">Home</Link>
        <Divider type="vertical" />
        <Link to="/about">About</Link>
      </nav>
      <Suspense fallback={null}>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/about" component={About} />
        </Switch>
      </Suspense>
    </Router>
  );
};

export default function App() {
  return (
    <div className="app-main">
      <LibVersion />
      <HelloModal />

      <Divider />

      <RouteExample />
    </div>
  );
}
