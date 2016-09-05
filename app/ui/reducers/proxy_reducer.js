import ActionTypes from '../actions/action_types';
import { getProxy, setProxy } from '../utils/app_utils';

const localDataProxy = getProxy();

const proxy = (state = {
  proxy: localDataProxy ? localDataProxy.status : true,
  initialSettings: !!localDataProxy
}, action) => {
  let proxyStatus = null;
  switch (action.type) {
    case ActionTypes.TOGGLE_PROXY:
      proxyStatus = ((typeof state.proxy === 'boolean') ? !state.proxy : false);
      setProxy(proxyStatus);
      return { ...state, proxy: proxyStatus };
    case ActionTypes.SET_PROXY:
      setProxy(state.proxy);
      return { ...state };
    case ActionTypes.FINISH_INITIAL_PROXY_SETTINGS:
      proxyStatus = getProxy();
      if (!proxyStatus) {
        setProxy(state.proxy);
      }
      return { ...state, initialSettings: true };
    case ActionTypes.PROXY_ERROR: {
      setProxy(false);
      return { ...state, proxy: false };
    }
    default:
      return state;
  }
};

export default proxy;
