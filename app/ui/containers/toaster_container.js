import { connect } from 'react-redux';
import Toaster from '../components/toaster';
import { hideToaster, showNextToaster } from '../actions/toaster_action';
import { retryNetwork } from '../actions/network_status_action';

const mapStateToProps = state => (
  {
    active: state.toaster.active,
    message: state.toaster.message,
    options: state.toaster.options,
    hasNext: state.toaster.hasNext,
    retryCount: state.networkStatus.retryCount,
    user: state.auth.user
  }
);

const mapDispatchToProps = dispatch => (
  {
    hideToaster: () => {
      dispatch(hideToaster());
    },
    showNextToaster: (message, options) => {
      dispatch(showNextToaster(message, options));
    },
    retryNetwork: (user) => {
      dispatch(hideToaster());
      dispatch(retryNetwork(user));
    }
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Toaster);
