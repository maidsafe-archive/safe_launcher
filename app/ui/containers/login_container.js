import { connect } from 'react-redux';
import Login from '../components/login';
import {
  login,
  cancelAuthReq,
  resetUser,
  setErrorMessage,
  clearErrorMessage
} from '../actions/auth_action';
import { showToaster } from '../actions/toaster_action';

const mapStateToProps = state => (
  {
    networkStatus: state.networkStatus.networkStatus,
    authenticated: state.auth.authenticated,
    authProcessing: state.auth.authProcessing,
    user: state.auth.user,
    error: state.auth.error,
    errorMsg: state.auth.errorMsg
  }
);

const mapDispatchToProps = dispatch => (
  {
    userLogin: payload => (dispatch(login(payload))),
    cancelAuthReq: () => (dispatch(cancelAuthReq())),
    resetUser: () => (dispatch(resetUser())),
    showToaster: (message, options) => (dispatch(showToaster(message, options))),
    setErrorMessage: msg => (dispatch(setErrorMessage(msg))),
    clearErrorMessage: () => (dispatch(clearErrorMessage()))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Login);
