import { connect } from 'react-redux';
import Register from '../components/register';
import { setRegisterStateNext, setRegisterStateBack, setRegisterState, register, cancelAuthReq } from '../actions/auth_action';

const mapStateToProps = function(state) {
  return {
    networkStatus: state.networkStatus.networkStatus,
    registerState: state.auth.registerState,
    authProcessing: state.auth.authProcessing,
    user: state.auth.user,
    authenticated: state.auth.authenticated
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    stateContinue: (user) => {
      dispatch(setRegisterStateNext(user))
    },
    stateBack: () => {
      dispatch(setRegisterStateBack())
    },
    setRegisterState: (navState) => {
      dispatch(setRegisterState(navState))
    },
    userRegister: (payload) => {
      dispatch(register(payload))
    },
    cancelAuthReq: () => {
      dispatch(cancelAuthReq())
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Register);
