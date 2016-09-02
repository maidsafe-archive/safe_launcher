import { connect } from 'react-redux';
import NetworkStatus from '../components/network_status';
import { showToaster } from '../actions/toaster_action';
import { MESSAGES } from '../constant';

const mapStateToProps = function(state) {
  return {
    status: state.networkStatus.networkStatus
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    onNetworkStatusClick: (status) => {
      switch (status) {
        case 0:
          dispatch(showToaster(MESSAGES.NETWORK_CONNECTING, { autoHide: true }));
          break;
        case 1:
          dispatch(showToaster(MESSAGES.NETWORK_CONNECTED, { autoHide: true }));
          break;
        case 2:
          dispatch(showToaster(MESSAGES.NETWORK_DISCONNECTED, { autoHide: true }));
          break;
        default:

      }
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NetworkStatus);
