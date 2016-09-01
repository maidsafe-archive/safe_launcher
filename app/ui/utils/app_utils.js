const LOCAL_STORAGE_KEYS = {
  SAFE_LAUNCHER_PROXY: 'safe_launcher_proxy',
};

export const appVersion = require('../../../package.json').version;

export let getProxy = () => {
  return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEYS.SAFE_LAUNCHER_PROXY));
};

export let setProxy = (status) => {
  if (status) {
    window.msl.startProxyServer();
  } else {
    window.msl.stopProxyServer();
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEYS.SAFE_LAUNCHER_PROXY, JSON.stringify({ 'status' : status }))
};

export let openExternal = (url) => {
  window.msl.openExternal(url);
};

export let bytesToSize = (bytes) => {
  var sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
  if (bytes === 0) {
    return '0 ' + sizes[0];
  }
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  if (i === 0) {
    return bytes + ' ' + sizes[i];
  }
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}
