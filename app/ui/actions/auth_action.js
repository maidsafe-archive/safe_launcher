import ActionTypes from './action_types';

export const loginSuccess = (res) => (
  {
    type: ActionTypes.LOGIN_SUCCESS,
    user: res
  }
);

export const loginError = (err) => (
  {
    type: ActionTypes.LOGIN_ERROR,
    error: err
  }
);

export const registerSuccess = (res) => ({
  type: ActionTypes.REGISTER_SUCCESS,
  user: res
});

export const registerError = (err) => ({
  type: ActionTypes.REGISTER_ERROR,
  error: err
});

export const setAuthProcessing = () => ({
  type: ActionTypes.AUTH_PROCESSING
});

export const cancelAuthReq = () => ({
  type: ActionTypes.AUTH_CANCEL
});

export const setRegisterStateNext = user => ({
  type: ActionTypes.REGISTER_STATE_NEXT,
  user
});

export const setRegisterStateBack = () => ({
  type: ActionTypes.REGISTER_STATE_BACK
});

export const setRegisterState = navState => ({
  type: ActionTypes.SET_REGISTER_STATE,
  navState
});

export const resetUser = () => ({
  type: ActionTypes.RESET_USER
});

export const login = payload => (
  dispatch => {
    dispatch(setAuthProcessing());
    window.msl.login(payload.accountSecret, payload.accountPassword, (err) => {
      if (err) {
        dispatch(loginError(err));
      } else {
        dispatch(loginSuccess(payload));
      }
    });
  }
);

export const register = payload => (
  dispatch => {
    dispatch(setAuthProcessing());
    window.msl.register(payload.accountSecret, payload.accountPassword, (err) => {
      if (err) {
        dispatch(registerError(err));
      } else {
        dispatch(registerSuccess(payload));
      }
    });
  }
);

export const logout = (userData) => {
  window.msl.clearAllSessions();
  window.msl.networkStateChange(0);
  window.msl.reconnect(userData);
  return {
    type: ActionTypes.LOGOUT
  };
};
