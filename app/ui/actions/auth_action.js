import ActionTypes from './action_types';

export const loginSuccess = (res) => {
  return {
    type: ActionTypes.LOGIN_SUCCESS,
    user: res
  };
}

export const loginError = (err) => {
  return {
    type: ActionTypes.LOGIN_ERROR,
    error: err
  };
}

export const registerSuccess = (res) => {
  return {
    type: ActionTypes.REGISTER_SUCCESS,
    user: res
  };
}

export const registerError = (err) => {
  return {
    type: ActionTypes.REGISTER_ERROR,
    error: err
  };
}

export const setAuthProcessing = () => {
  return {
    type: ActionTypes.AUTH_PROCESSING
  };
}

export const cancelAuthReq = () => {
  return {
    type: ActionTypes.AUTH_CANCEL
  };
}

export const setRegisterStateNext = (user) => {
  return {
    type: ActionTypes.REGISTER_STATE_NEXT,
    user: user
  };
}

export const setRegisterStateBack = () => {
  return {
    type: ActionTypes.REGISTER_STATE_BACK
  };
}

export const setRegisterState = (navState) => {
  return {
    type: ActionTypes.SET_REGISTER_STATE,
    navState: navState
  };
}

export const resetUser = () => {
  return {
    type: ActionTypes.RESET_USER
  };
}

export const login = (payload) => {
  return dispatch => {
    dispatch(setAuthProcessing());
    window.msl.login(payload.accountSecret, payload.accountPassword, (err, res) => {
      if (err) {
        dispatch(loginError(err))
      } else {
        dispatch(loginSuccess(payload))
      }
    });
  }
}

export const register = (payload) => {
  return dispatch => {
    dispatch(setAuthProcessing());
    window.msl.register(payload.accountSecret, payload.accountPassword, (err, res) => {
      if (err) {
        dispatch(registerError(err))
      } else {
        dispatch(registerSuccess(payload))
      }
    });
  }
}

export const logout = (userData) => {
  window.msl.clearAllSessions();
  window.msl.networkStateChange(0);
  window.msl.reconnect(userData);
  return {
    type: ActionTypes.LOGOUT
  }
}
