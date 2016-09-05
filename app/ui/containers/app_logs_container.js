import { connect } from 'react-redux';
import AppLogs from '../components/app_logs';
import { setLogsFilter, resetLogsFilter } from '../actions/app_action';

const mapStateToProps = state => (
  {
    authenticated: state.auth.authenticated,
    appLogs: state.user.appLogs,
    logFilter: state.user.logFilter
  }
);

const mapDispatchToProps = dispatch => (
  {
    setLogsFilter: (fields) => (dispatch(setLogsFilter(fields))),
    resetLogsFilter: () => (dispatch(resetLogsFilter()))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(AppLogs);
