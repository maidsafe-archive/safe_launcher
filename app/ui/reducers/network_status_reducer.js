import ActionTypes from '../actions/action_types';

const networkStatus = (state = {
  networkStatus: 0,
  retryCount: 0
}, action) => {
  switch (action.type) {
    case ActionTypes.TOAST_NETWORK_STATUS:
      return { ...state, showToaster: true };
    case ActionTypes.RETRYING_NETWORK: {
      return { ...state, networkStatus: 0, retryCount: state.retryCount + 1 };
    }
    case ActionTypes.SET_NETWORK_CONNECTING:
      return { ...state, networkStatus: 0 };
    case ActionTypes.SET_NETWORK_CONNECTED:
      return { ...state, networkStatus: 1, retryCount: 0 };
    case ActionTypes.SET_NETWORK_DISCONNECTED:
      return { ...state, networkStatus: 2 };
    default:
      return state;
  }
};

export default networkStatus;
