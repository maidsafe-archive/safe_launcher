import { connect } from 'react-redux';
import Register from '../components/register';
import {
  setRegisterStateNext,
  setRegisterStateBack,
  setRegisterState,
  register,
  cancelAuthReq,
  setErrorMessage,
  clearErrorMessage
} from '../actions/auth_action';
import { showToaster } from '../actions/toaster_action';

const mapStateToProps = state => (
  {
    networkStatus: state.networkStatus.networkStatus,
    registerState: state.auth.registerState,
    authProcessing: state.auth.authProcessing,
    user: state.auth.user,
    error: state.auth.error,
    errorMsg: state.auth.errorMsg,
    authenticated: state.auth.authenticated
  }
);

const mapDispatchToProps = dispatch => (
  {
    stateContinue: user => (dispatch(setRegisterStateNext(user))),
    stateBack: () => (dispatch(setRegisterStateBack())),
    setRegisterState: navState => (dispatch(setRegisterState(navState))),
    userRegister: payload => (dispatch(register(payload))),
    cancelAuthReq: () => (dispatch(cancelAuthReq())),
    setErrorMessage: msg => (dispatch(setErrorMessage(msg))),
    clearErrorMessage: () => (dispatch(clearErrorMessage())),
    showToaster: (message, options) => (dispatch(showToaster(message, options)))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Register);
