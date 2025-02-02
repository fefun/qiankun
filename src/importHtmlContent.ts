/*
 * @Author: aaron.qi aaron.qi@wayz.ai
 * @Date: 2023-03-02 11:14:28
 * @LastEditors: aaron.qi aaron.qi@wayz.ai
 * @LastEditTime: 2023-03-10 14:41:35
 * @FilePath: /qiankun/src/importHtmlContent.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// @ts-ignore
import { defaultGetPublicPath, readResAsString } from 'import-html-entry/lib/utils';
// @ts-ignore
import processTpl, { genLinkReplaceSymbol, genScriptReplaceSymbol } from 'import-html-entry/lib/process-tpl';
// @ts-ignore
import { getExternalStyleSheets, getExternalScripts, execScripts } from 'import-html-entry';
import type { ExecScriptOpts } from 'import-html-entry';
if (!window.fetch) {
  throw new Error('[import-html-entry] Here is no "fetch" on the window env, you need to polyfill it');
}

const embedHTMLCache = {} as any;
export interface IImportResult {
  template: string;

  assetPublicPath: string;

  execScripts: <T>(sandbox?: object, strictGlobal?: boolean, opts?: ExecScriptOpts) => Promise<T>;

  getExternalScripts: () => Promise<string[]>;

  getExternalStyleSheets: () => Promise<string[]>;
}
const isInlineCode = (code: string) => code.startsWith('<');

const defaultFetch = window.fetch.bind(window);
function defaultGetTemplate(tpl: string) {
  return tpl;
}

const ASSET_URL_REG = /url\(['"]?([^#'"):,;]+)['"]?\)/gi;

/**
 * 补全字体/图片链接
 * @param content
 * @param url
 * @returns
 */
function setAssetsUrl(content: string, url: string) {
  const res = content.replace(ASSET_URL_REG, (_, path) => {
    const link = new URL(path, url);
    return `url('${link.href}')`;
  });
  return res;
}

/**
 * convert external css link to inline style for performance optimization
 * @param template
 * @param styles
 * @param opts
 * @return embedHTML
 */
function getEmbedHTML(assetPublicPath: string, template: string, styles: any, opts = {} as any) {
  const { fetch = defaultFetch } = opts;
  let embedHTML = setAssetsUrl(template, assetPublicPath);

  return getExternalStyleSheets(styles, fetch).then((styleSheets: any[]) => {
    embedHTML = styles.reduce((html: string, styleSrc: string, i: number) => {
      const res = html.replace(
        genLinkReplaceSymbol(styleSrc),
        isInlineCode(styleSrc)
          ? `${styleSrc}`
          : `<style>/* ${styleSrc} */${setAssetsUrl(styleSheets[i], styleSrc)}</style>`,
      );
      return res;
    }, embedHTML);
    return embedHTML;
  });
}
export default function importHTMLContent(html: string, opts = {} as any): Promise<IImportResult> {
  const fetch = defaultFetch;
  let getPublicPath = defaultGetPublicPath;
  let getTemplate = defaultGetTemplate;
  const { postProcessTemplate } = opts;

  getPublicPath = opts.getPublicPath || opts.getDomain || defaultGetPublicPath;
  getTemplate = opts.getTemplate || defaultGetTemplate;

  return Promise.resolve().then(() => {
    const assetPublicPath = getPublicPath(location.href);
    const { template, scripts, entry, styles } = processTpl(getTemplate(html), assetPublicPath, postProcessTemplate);
    return getEmbedHTML(assetPublicPath, template, styles, { fetch }).then((embedHTML: string) => ({
      template: embedHTML,
      assetPublicPath,
      getExternalScripts: () => getExternalScripts(scripts, fetch),
      // getExternalStyleSheets: () => getExternalStyleSheets(styles, fetch),
      execScripts: (proxy: any, strictGlobal: any, opts2 = {} as any) => {
        if (!scripts.length) {
          return Promise.resolve();
        }
        return execScripts(entry, scripts, proxy, {
          fetch,
          strictGlobal,
          ...opts2,
        });
      },
    }));
  });
}

export function importHTML(url: string, opts = {} as any) {
  let fetch = defaultFetch;
  let autoDecodeResponse = false;
  let getPublicPath = defaultGetPublicPath;
  let getTemplate = defaultGetTemplate;
  const { postProcessTemplate } = opts;

  // compatible with the legacy importHTML api
  if (typeof opts === 'function') {
    fetch = opts;
  } else {
    // fetch option is availble
    if (opts.fetch) {
      // fetch is a funciton
      if (typeof opts.fetch === 'function') {
        fetch = opts.fetch;
      } else {
        // configuration
        fetch = opts.fetch.fn || defaultFetch;
        autoDecodeResponse = !!opts.fetch.autoDecodeResponse;
      }
    }
    getPublicPath = opts.getPublicPath || opts.getDomain || defaultGetPublicPath;
    getTemplate = opts.getTemplate || defaultGetTemplate;
  }

  return (
    embedHTMLCache[url] ||
    (embedHTMLCache[url] = fetch(url)
      .then((response) => readResAsString(response, autoDecodeResponse))
      .then((html) => {
        const assetPublicPath = getPublicPath(url);
        const { template, scripts, entry, styles } = processTpl(
          getTemplate(html),
          assetPublicPath,
          postProcessTemplate,
        );

        return getEmbedHTML(assetPublicPath, template, styles, { fetch }).then((embedHTML: any) => ({
          template: embedHTML,
          assetPublicPath,
          getExternalScripts: () => getExternalScripts(scripts, fetch),
          getExternalStyleSheets: () => getExternalStyleSheets(styles, fetch),
          execScripts: (proxy: Window, strictGlobal: any, opts2 = {}) => {
            if (!scripts.length) {
              return Promise.resolve();
            }
            return execScripts(entry, scripts, proxy, {
              fetch,
              strictGlobal,
              ...opts2,
            });
          },
        }));
      }))
  );
}
