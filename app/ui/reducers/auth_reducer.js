import ActionTypes from '../actions/action_types';

const initialState = {
  authProcessing: false,
  authenticated: false,
  error: null,
  user: null,
  registerState: 0
};

const auth = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_SUCCESS:
    case ActionTypes.REGISTER_SUCCESS:
      if (!state.authProcessing) {
        return state;
      }
      return { ...state, authenticated: true, user: action.user, authProcessing: false }
      break;
    case ActionTypes.LOGIN_ERROR:
      if (!state.authProcessing) {
        return state;
      }
      return { ...state, error: action.error, authProcessing: false }
      break;
    case ActionTypes.REGISTER_ERROR:
      if (!state.authProcessing) {
        return state;
      }
      return { ...state, error: action.error, authProcessing: false, registerState: 2 }
      break;
    case ActionTypes.AUTH_PROCESSING:
      return { ...state, authProcessing: true }
      break;
    case ActionTypes.AUTH_CANCEL:
      return { ...state, authProcessing: false }
      break;
    case ActionTypes.REGISTER_STATE_NEXT:
      if (state.registerState === 2 && action.user.accountSecret) {
        return { ...state, registerState: state.registerState + 1, user: { ...state.user, accountSecret: action.user.accountSecret } }
      }
      if (state.registerState === 4) {
        return state;
      }
      return { ...state, registerState: state.registerState + 1 }
      break;
    case ActionTypes.REGISTER_STATE_BACK:
      if (state.registerState === 0) {
        return state;
      }
      return { ...state, registerState: state.registerState - 1 }
      break;
    case ActionTypes.SET_REGISTER_STATE:
      if (action.navState > 2 && !(state.user && state.user.accountSecret)) {
        return state;
      }
      return { ...state, registerState: action.navState }
      break;
    case ActionTypes.RESET_USER:
      return { ...state, user: null, registerState: 0, error: null };
      break;
    case ActionTypes.LOGOUT:
      return initialState;
      break;
    default:
      return state;
  }
};

export default auth;
