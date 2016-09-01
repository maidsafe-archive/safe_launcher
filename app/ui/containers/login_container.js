import { connect } from 'react-redux';
import Login from '../components/login';
import { login, cancelAuthReq, resetUser } from '../actions/auth_action';

const mapStateToProps = function(state) {
  return {
    networkStatus: state.networkStatus.networkStatus,
    authenticated: state.auth.authenticated,
    authProcessing: state.auth.authProcessing,
    user: state.auth.user,
    error: state.auth.error
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    userLogin: (payload) => {
      dispatch(login(payload))
    },
    cancelAuthReq: () => {
      dispatch(cancelAuthReq())
    },
    resetUser: () => {
      dispatch(resetUser())
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
