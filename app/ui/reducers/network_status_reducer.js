import ActionTypes from '../actions/action_types';

const networkStatus = (state = {
  networkStatus: 0
}, action) => {
  switch (action.type) {
    case ActionTypes.TOAST_NETWORK_STATUS:
      return { ...state, showToaster: true };
      break;
    case ActionTypes.RETRYING_NETWORK:
    case ActionTypes.SET_NETWORK_CONNECTING:
      return { ...state, networkStatus: 0 }
      break;
    case ActionTypes.SET_NETWORK_CONNECTED:
      return { ...state, networkStatus: 1 }
      break;
    case ActionTypes.SET_NETWORK_DISCONNECTED:
      return { ...state, networkStatus: 2 }
      break;
    default:
      return state;
  }
};

export default networkStatus;
