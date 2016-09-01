import { connect } from 'react-redux';
import Splash from '../components/splash';
import { retryNetwork } from '../actions/network_status_action';

const mapStateToProps = function(state) {
  return {
    status: state.networkStatus.networkStatus,
    initialSettings: state.proxy.initialSettings
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    networkRetry: () => {
      return dispatch(retryNetwork());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Splash);
