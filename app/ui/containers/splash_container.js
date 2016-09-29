import { connect } from 'react-redux';
import Splash from '../components/splash';
import { retryNetwork } from '../actions/network_status_action';

const mapStateToProps = state => (
  {
    status: state.networkStatus.networkStatus,
    initialSettings: state.user.initialSettings
  }
);

const mapDispatchToProps = dispatch => (
  {
    networkRetry: () => (dispatch(retryNetwork()))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Splash);
