import { connect } from 'react-redux';
import Dashboard from '../components/dashboard';
import {
  updateAccountStorage,
  setLastUpdateFromNow,
  decAccountUpdateTimeout
} from '../actions/app_action';

const mapStateToProps = state => (
  {
    authenticated: state.auth.authenticated,
    dashData: state.user.dashData,
    unAuthGET: state.user.unAuthGET,
    authHTTPMethods: state.user.authHTTPMethods,
    accountStorage: state.user.accountStorage
  }
);

const mapDispatchToProps = dispatch => (
  {
    updateAccountStorage: () => (dispatch(updateAccountStorage())),
    decAccountUpdateTimeout: () => (dispatch(decAccountUpdateTimeout())),
    setLastUpdateFromNow: () => (dispatch(setLastUpdateFromNow()))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
