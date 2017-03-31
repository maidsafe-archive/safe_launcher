import ActionTypes from '../actions/action_types';

const initialState = {
  authProcessing: false,
  authenticated: false,
  error: {},
  errorMsg: null,
  user: {},
  registerState: 0
};

const auth = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_SUCCESS:
    case ActionTypes.REGISTER_SUCCESS:
      if (!state.authProcessing) {
        return state;
      }
      return { ...state, authenticated: true, user: action.user, authProcessing: false };
    case ActionTypes.LOGIN_ERROR:
      if (!state.authProcessing) {
        return state;
      }
      return { ...state, user: Object.assign({}), error: action.error, authProcessing: false };
    case ActionTypes.REGISTER_ERROR:
      if (!state.authProcessing) {
        return state;
      }
      return {
        ...state,
        error: action.error,
        user: Object.assign({}),
        authProcessing: false,
        registerState: 1
      };
    case ActionTypes.AUTH_PROCESSING:
      return { ...state, authProcessing: true };
    case ActionTypes.AUTH_CANCEL:
      return { ...state, authProcessing: false };
    case ActionTypes.SET_ERROR_MESSAGE: {
      return { ...state, errorMsg: action.msg, error: Object.assign({}) };
    }
    case ActionTypes.CLEAR_ERROR_MESSAGE: {
      return { ...state, errorMsg: '' };
    }
    case ActionTypes.REGISTER_STATE_NEXT:
      if (state.registerState === 1 && action.user.inviteToken) {
        return {
          ...state,
          registerState: state.registerState + 1,
          user: { ...state.user, inviteToken: action.user.inviteToken }
        };
      }
      if (state.registerState === 3 && action.user.accountSecret) {
        return {
          ...state,
          registerState: state.registerState + 1,
          user: { ...state.user, accountSecret: action.user.accountSecret }
        };
      }
      if (state.registerState === 5) {
        return state;
      }
      return { ...state, registerState: state.registerState + 1 };
    case ActionTypes.REGISTER_STATE_BACK:
      if (state.registerState === 0) {
        return state;
      }
      return { ...state, registerState: state.registerState - 1 };
    case ActionTypes.SET_REGISTER_STATE:
      if (action.navState > 3 && !(state.user && state.user.accountSecret)) {
        return state;
      }
      return { ...state, registerState: action.navState };
    case ActionTypes.RESET_USER: {
      return {
        ...state,
        user: Object.assign({}),
        registerState: 0,
        error: Object.assign({}),
        errorMsg: ''
      };
    }
    case ActionTypes.LOGOUT:
      return initialState;
    default:
      return state;
  }
};

export default auth;
