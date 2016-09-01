import { connect } from 'react-redux';
import NetworkStatus from '../components/network_status';
import { toastNetworkStatus } from '../actions/network_status_action';

const mapStateToProps = function(state) {
  return {
    status: state.networkStatus.networkStatus
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    onNetworkStatusClick: (status) => {
      dispatch(toastNetworkStatus(status))
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NetworkStatus);
