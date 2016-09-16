import pkg from '../../../package.json';

const LOCAL_STORAGE_KEYS = {
  SAFE_LAUNCHER_PROXY: 'safe_launcher_proxy',
};

export const appVersion = pkg.version;

export const LOG_STATUS = {
  0: {
    className: 'in-progress',
    code: 'IN_PROGRESS'
  },
  1: {
    className: 'completed',
    code: 'SUCCESS'
  },
  '-1': {
    className: 'error',
    code: 'FAILURE'
  }
};

export const getProxy = () => (
  JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEYS.SAFE_LAUNCHER_PROXY))
);

export const setProxy = (status) => {
  if (status) {
    window.msl.startProxyServer();
  } else {
    window.msl.stopProxyServer();
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEYS.SAFE_LAUNCHER_PROXY,
    JSON.stringify({ status }));
};

export const openExternal = (url) => {
  window.msl.openExternal(url);
};

export const bytesToSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) {
    return `0 ${sizes[0]}`;
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  }
  const resultStr = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${resultStr} ${sizes[i]}`;
};
