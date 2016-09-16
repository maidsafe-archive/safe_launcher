import ActionTypes from './action_types';

export const toastNetworkStatus = () => (
  {
    type: ActionTypes.TOAST_NETWORK_STATUS
  }
);

export const retryNetwork = (user) => {
  window.msl.reconnect(user);
  return {
    type: ActionTypes.RETRYING_NETWORK
  };
};

export const setNetworkDisconnected = () => (
  {
    type: ActionTypes.SET_NETWORK_DISCONNECTED
  }
);

export const setNetworkConnected = () => (
  {
    type: ActionTypes.SET_NETWORK_CONNECTED
  }
);

export const setNetworkConnecting = () => (
  {
    type: ActionTypes.SET_NETWORK_CONNECTING
  }
);
