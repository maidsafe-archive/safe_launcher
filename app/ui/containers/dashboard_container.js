import { connect } from 'react-redux';
import Dashboard from '../components/dashboard';
import { updateAccountStorage, setAccountInfoTimeout, setLastUpdateFromNow, decAccountUpdateTimeout } from '../actions/app_action';

const mapStateToProps = function(state) {
  return {
    authenticated: state.auth.authenticated,
    dashData: state.user.dashData,
    unAuthGET: state.user.unAuthGET,
    authHTTPMethods: state.user.authHTTPMethods,
    accountStorage: state.user.accountStorage
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    updateAccountStorage: () => {
      dispatch(updateAccountStorage());
    },
    decAccountUpdateTimeout: () => {
      dispatch(decAccountUpdateTimeout())
    },
    setLastUpdateFromNow: () => {
      dispatch(setLastUpdateFromNow());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
