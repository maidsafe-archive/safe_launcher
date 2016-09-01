import { connect } from 'react-redux';
import AccountAppList from '../components/account_app_list';
import { logout } from '../actions/auth_action';
import { showAppDetailPage, hideAppDetailPage, showNextAuthRequest, hideAuthRequest, revokeApplication, setLogsFilter, resetLogsFilter } from '../actions/app_action';

const mapStateToProps = function(state) {
  return {
    authenticated: state.auth.authenticated,
    appList: state.user.appList,
    currentAppLogs: state.user.currentAppLogs,
    logFilter: state.user.logFilter,
    appDetailPageVisible: state.user.appDetailPageVisible,
    showAuthRequest: state.user.showAuthRequest,
    authRequestPayload: state.user.authRequestPayload,
    authRequestHasNext: state.user.authRequestHasNext,
    currentApp: state.user.currentApp,
    user: state.user.user
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    showAppDetailPage: (appId) => {
      dispatch(showAppDetailPage(appId))
    },
    hideAppDetailPage: () => {
      dispatch(hideAppDetailPage())
    },
    hideAuthRequest: (payload, status) => {
      dispatch(hideAuthRequest(payload, status))
    },
    showNextAuthRequest: (payload, status) => {
      dispatch(showNextAuthRequest(payload, status));
    },
    revokeApplication: (appId) => {
      dispatch(revokeApplication(appId))
    },
    logout: () => {
      dispatch(logout())
    },
    setLogsFilter: (fields) => {
      dispatch(setLogsFilter(fields))
    },
    resetLogsFilter: () => {
      dispatch(resetLogsFilter())
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountAppList);
