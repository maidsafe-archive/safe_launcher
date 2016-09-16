import { connect } from 'react-redux';
import NetworkStatus from '../components/network_status';
import { showToaster } from '../actions/toaster_action';
import { MESSAGES, CONSTANT } from '../constant';

const mapStateToProps = state => (
  {
    status: state.networkStatus.networkStatus
  }
);

const mapDispatchToProps = dispatch => (
  {
    onNetworkStatusClick: status => {
      switch (status) {
        case 0:
          dispatch(showToaster(MESSAGES.NETWORK_CONNECTING, { autoHide: true }));
          break;
        case 1:
          dispatch(showToaster(MESSAGES.NETWORK_CONNECTED, { autoHide: true }));
          break;
        default:

      }
    }
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(NetworkStatus);
