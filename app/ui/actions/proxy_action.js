import ActionTypes from './action_types';

export const toggleProxy = () => (
  {
    type: ActionTypes.TOGGLE_PROXY
  }
);

export const setProxy = () => (
  {
    type: ActionTypes.SET_PROXY
  }
);

export const finishInitialProxySettings = () => (
  {
    type: ActionTypes.FINISH_INITIAL_PROXY_SETTINGS
  }
);

export const setProxyError = () => (
  {
    type: ActionTypes.PROXY_ERROR
  }
);
