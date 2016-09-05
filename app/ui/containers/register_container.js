import { connect } from 'react-redux';
import Register from '../components/register';
import {
  setRegisterStateNext,
  setRegisterStateBack,
  setRegisterState,
  register,
  cancelAuthReq
} from '../actions/auth_action';
import { showToaster } from '../actions/toaster_action';

const mapStateToProps = state => (
  {
    networkStatus: state.networkStatus.networkStatus,
    registerState: state.auth.registerState,
    authProcessing: state.auth.authProcessing,
    user: state.auth.user,
    error: state.auth.error,
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
    showToaster: (message, options) => (dispatch(showToaster(message, options)))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Register);
