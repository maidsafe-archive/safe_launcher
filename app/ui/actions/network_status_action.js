import ActionTypes from './action_types';

export const toastNetworkStatus = () => {
  return {
    type: ActionTypes.TOAST_NETWORK_STATUS
  }
}

export const retryNetwork = () => {
  return {
    type: ActionTypes.RETRYING_NETWORK
  }
}

export const setNetworkDisconnected = () => {
  return {
    type: ActionTypes.SET_NETWORK_DISCONNECTED
  }
}

export const setNetworkConnected = () => {
  return {
    type: ActionTypes.SET_NETWORK_CONNECTED
  };
}

export const setNetworkConnecting = () => {
  return {
    type: ActionTypes.SET_NETWORK_CONNECTING
  }
}
