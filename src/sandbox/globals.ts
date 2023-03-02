// generated from https://github.com/sindresorhus/globals/blob/main/globals.json es2015 part
// only init its values while Proxy is supported
import globalss from 'globals';

export const globals = window.Proxy
  ? Object.keys(globalss.es2015).filter(
      (p) => /* just keep the available properties in current window context */ p in window,
    )
  : [];
