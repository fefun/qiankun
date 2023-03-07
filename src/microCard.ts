import { importEntry } from 'import-html-entry';
import type { ImportEntryOpts } from 'import-html-entry';
import { forEach } from 'lodash';
import { cloneDeep } from 'lodash';
import { QiankunError } from './error';
import importHTMLContent from './importHtmlContent';
import type { IImportResult } from './importHtmlContent';
import type { OnGlobalStateChangeCallback, SandBox, SandBoxConfig } from './interfaces';
import { createSandboxContainer, css } from './sandbox';
import { cachedGlobals } from './sandbox/proxySandbox';
import {
  getContainer,
  getDefaultTplWrapper,
  getWrapperId,
  isEnableScopedCSS,
  performanceGetEntriesByName,
  performanceMark,
  performanceMeasure,
} from './utils';
const rawAppendChild = HTMLElement.prototype.appendChild;
const rawRemoveChild = HTMLElement.prototype.removeChild;

type AppCofig = {
  name: string;
  container: string | HTMLDivElement;
  entry?: string;
  entryContent?: string;
  sandbox?: SandBoxConfig;
};
type TState = Record<string, any>;
type TLinstener = (data: any) => void;
type TLifecyclesEnv = {
  container: HTMLElement | undefined;
  state: TState;
  prevState: TState;
  on: (event: string, fn: TLinstener) => void;
  dispatch: (event: string, data: any) => void;
};
export default class MicroCard {
  private uid: string;
  private name: string;
  private container: HTMLElement | undefined;
  private entry: string | undefined;
  private entryContent: string | undefined;
  private sandbox: SandBoxConfig;
  private sandboxContainer?: {
    instance: SandBox;
    mount: () => Promise<void>;
    unmount: () => Promise<void>;
  };
  private lifecycleHooks: {
    mount?: (env: TLifecyclesEnv) => void;
    unmount?: (evn: TLifecyclesEnv) => void;
    update?: (env: TLifecyclesEnv) => void;
  } = {};
  private eventLinstener: Record<string, TLinstener[]> = {};
  private stateChangeLinstener: OnGlobalStateChangeCallback | undefined;
  private state: TState = {};
  private stateOld: TState = {};
  perfMarkName: string;

  constructor(app: AppCofig) {
    this.uid = 'micro_' + Math.round(new Date().getTime() + Math.random() * 1e10).toString(16);
    const { name, container, entry, entryContent, sandbox = { experimentalStyleIsolation: true } } = app;
    this.name = name;
    this.entry = entry;
    this.entryContent = entryContent;
    this.sandbox = sandbox;
    this.perfMarkName = `[qiankun] App ${this.name} Loading`;
    const $con = getContainer(container);
    if (!$con) {
      assertElementExist($con, `container ${container} not existed`);
      return;
    }
    this.container = $con;
    if (entryContent) {
      this.loadContent(entryContent);
    } else if (entry) {
      this.load(entry);
    }
    return this;
  }
  /**
   *
   * @param callback
   * @param fireImmediately
   */
  onStateChange(callback: OnGlobalStateChangeCallback, fireImmediately?: boolean) {
    if (!(callback instanceof Function)) {
      console.error('[qiankun] callback must be function!');
      return;
    }
    this.stateChangeLinstener = callback;
    if (fireImmediately) {
      const cloneState = cloneDeep(this.state);
      callback(cloneState, cloneState);
    }
  }

  /**
   * setGlobalState 更新 store 数据
   *
   * 1. 对输入 state 的第一层属性做校验，只有初始化时声明过的第一层（bucket）属性才会被更改
   * 2. 修改 store 并触发全局监听
   *
   * @param state
   */
  setState(state: Record<string, any> = {}) {
    if (state === this.state) {
      console.warn('[qiankun] state has not changed！');
      return false;
    }

    const changeKeys: string[] = [];
    const prevGlobalState = (this.stateOld = cloneDeep(this.state));
    this.state = cloneDeep(
      Object.keys(state).reduce((_globalState, changeKey) => {
        if (_globalState[changeKey] !== state[changeKey]) {
          changeKeys.push(changeKey);
          return Object.assign(_globalState, { [changeKey]: state[changeKey] });
        }
        return _globalState;
      }, this.state),
    );
    if (changeKeys.length === 0) {
      console.warn('[qiankun] state has not changed！');
      return false;
    }
    if (this.stateChangeLinstener) {
      this.stateChangeLinstener(this.state, prevGlobalState);
    }
    if (this.lifecycleHooks.update) {
      this.lifecycleHooks.update(this._getEvn());
    }
    return this;
  }
  getState() {
    return this.state;
  }
  private _getEvn() {
    return {
      container: this.container,
      state: this.state,
      prevState: this.stateOld,
      on: this.on,
      dispatch: this.dispatch,
    };
  }
  // 注销该应用下的依赖
  offStateChange() {
    this.stateChangeLinstener = undefined;
    return true;
  }
  /**
   * 加载html链接
   * @param url
   * @param importEntryOpts
   */
  load(url: string, importEntryOpts?: ImportEntryOpts) {
    importEntry(url, importEntryOpts).then((res) => {
      this._exec(res);
    });
    return this;
  }
  /**
   * 加载html内容
   * @param htmlContent
   */
  loadContent(htmlContent: string) {
    importHTMLContent(htmlContent).then((res) => {
      this._exec(res);
    });
    return this;
  }
  private async _exec({ template, execScripts }: IImportResult) {
    const sandbox = this.sandbox;
    const uid = this.uid;

    let global = window;

    const appContent = getDefaultTplWrapper(uid, sandbox)(template);

    const strictStyleIsolation = typeof sandbox === 'object' && !!sandbox.strictStyleIsolation;

    if (process.env.NODE_ENV === 'development' && strictStyleIsolation) {
      console.warn(
        "[qiankun] strictStyleIsolation configuration will be removed in 3.0, pls don't depend on it or use experimentalStyleIsolation instead!",
      );
    }

    const scopedCSS = isEnableScopedCSS(sandbox);
    const initialAppWrapperElement: HTMLElement | null = createElement(
      appContent,
      strictStyleIsolation,
      scopedCSS,
      uid,
    );
    // 更新模板
    this.render(initialAppWrapperElement);

    const initialAppWrapperGetter = getAppWrapperGetter(
      uid,
      false,
      strictStyleIsolation,
      scopedCSS,
      () => initialAppWrapperElement,
    );

    const useLooseSandbox = typeof sandbox === 'object' && !!sandbox.loose;
    // enable speedy mode by default
    const speedySandbox = typeof sandbox === 'object' ? sandbox.speedy !== false : true;
    if (this.sandboxContainer) {
      // unmount first
      await this.sandboxContainer.unmount();
    }
    let sandboxContainer;
    if (sandbox) {
      this.sandboxContainer = sandboxContainer = createSandboxContainer(
        uid,
        initialAppWrapperGetter,
        scopedCSS,
        useLooseSandbox,
        undefined,
        global,
        speedySandbox,
      );
      // 用沙箱的代理对象作为接下来使用的全局对象
      global = sandboxContainer.instance.proxy as typeof window;
    }

    await execScripts(global, sandbox && !useLooseSandbox, {
      scopedGlobalVariables: speedySandbox ? cachedGlobals : [],
    });
    this.lifecycleHooks = global.__entry__ || {};

    const markName = this.perfMarkName;
    if (process.env.NODE_ENV === 'development') {
      const marks = performanceGetEntriesByName(markName, 'mark');
      if (marks && !marks.length) {
        performanceMark(markName);
      }
    }
    if (this.sandboxContainer) {
      await this.sandboxContainer.mount();
    }
    if (this.lifecycleHooks.mount) {
      this.lifecycleHooks.mount(this._getEvn());
    }
    this.render(initialAppWrapperElement);
    if (process.env.NODE_ENV === 'development') {
      const measureName = `[qiankun] App ${uid} Loading Consuming`;
      performanceMeasure(measureName, markName);
    }
  }
  render(element: HTMLElement | null) {
    const containerElement = this.container;
    if (containerElement && !containerElement.contains(element)) {
      // clear the container
      while (containerElement!.firstChild) {
        rawRemoveChild.call(containerElement, containerElement!.firstChild);
      }

      // append the element to container if it exist
      if (element) {
        rawAppendChild.call(containerElement, element);
      }
    }

    return undefined;
  }
  unmount = async () => {
    const unmount = this.lifecycleHooks.unmount;
    if (unmount) {
      unmount(this._getEvn());
      this.lifecycleHooks = {};
    }
    if (this.sandboxContainer) {
      await this.sandboxContainer.unmount();
      this.sandboxContainer = undefined;
    }
    this.stateChangeLinstener = undefined;
    this.state = {};
    this.stateOld = {};
    this.render(null);
    Object.keys(this.eventLinstener).forEach((k) => {
      delete this.eventLinstener[k];
    });
  };
  // 事件监听
  on = (event: string, fn: TLinstener) => {
    if (typeof fn !== 'function') {
      console.warn('required type is function');
      return;
    }
    if (!this.eventLinstener[event]) {
      this.eventLinstener[event] = [];
    }
    this.eventLinstener[event].push(fn);
  };
  // 事件触发
  dispatch = (event: string, data: any) => {
    const lins = this.eventLinstener[event] || [];
    lins.forEach((fn) => {
      fn(data);
    });
  };
}

function assertElementExist(element: Element | null | undefined, msg?: string) {
  if (!element) {
    if (msg) {
      throw new QiankunError(msg);
    }

    throw new QiankunError('element not existed!');
  }
}

const supportShadowDOM = !!document.head.attachShadow || !!(document.head as any).createShadowRoot;

function createElement(
  appContent: string,
  strictStyleIsolation: boolean,
  scopedCSS: boolean,
  appInstanceId: string,
): HTMLElement {
  const containerElement = document.createElement('div');
  containerElement.innerHTML = appContent;
  // appContent always wrapped with a singular div
  const appElement = containerElement.firstChild as HTMLElement;
  if (strictStyleIsolation) {
    if (!supportShadowDOM) {
      console.warn(
        '[qiankun]: As current browser not support shadow dom, your strictStyleIsolation configuration will be ignored!',
      );
    } else {
      const { innerHTML } = appElement;
      appElement.innerHTML = '';
      let shadow: ShadowRoot;

      if (appElement.attachShadow) {
        shadow = appElement.attachShadow({ mode: 'open' });
      } else {
        // createShadowRoot was proposed in initial spec, which has then been deprecated
        shadow = (appElement as any).createShadowRoot();
      }
      shadow.innerHTML = innerHTML;
    }
  }

  if (scopedCSS) {
    const attr = appElement.getAttribute(css.QiankunCSSRewriteAttr);
    if (!attr) {
      appElement.setAttribute(css.QiankunCSSRewriteAttr, appInstanceId);
    }

    const styleNodes = appElement.querySelectorAll('style') || [];
    forEach(styleNodes, (stylesheetElement: HTMLStyleElement) => {
      css.process(appElement!, stylesheetElement, appInstanceId);
    });
  }

  return appElement;
}

/** generate app wrapper dom getter */
function getAppWrapperGetter(
  appInstanceId: string,
  useLegacyRender: boolean,
  strictStyleIsolation: boolean,
  scopedCSS: boolean,
  elementGetter: () => HTMLElement | null,
) {
  return () => {
    if (useLegacyRender) {
      if (strictStyleIsolation) throw new QiankunError('strictStyleIsolation can not be used with legacy render!');
      if (scopedCSS) throw new QiankunError('experimentalStyleIsolation can not be used with legacy render!');

      const appWrapper = document.getElementById(getWrapperId(appInstanceId));
      assertElementExist(appWrapper, `Wrapper element for ${appInstanceId} is not existed!`);
      return appWrapper!;
    }

    const element = elementGetter();
    assertElementExist(element, `Wrapper element for ${appInstanceId} is not existed!`);

    if (strictStyleIsolation && supportShadowDOM) {
      return element!.shadowRoot!;
    }

    return element!;
  };
}
