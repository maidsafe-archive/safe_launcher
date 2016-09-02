import { connect } from 'react-redux';
import Toaster from '../components/toaster';
import { hideToaster, showNextToaster } from '../actions/toaster_action';
import { retryNetwork } from '../actions/network_status_action';

const mapStateToProps = function(state) {
  return {
    active: state.toaster.active,
    message: state.toaster.message,
    options: state.toaster.options,
    hasNext: state.toaster.hasNext,
    retryCount: state.networkStatus.retryCount
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    hideToaster: () => {
      dispatch(hideToaster());
    },
    showNextToaster: (message, options) => {
      dispatch(showNextToaster(message, options));
    },
    retryNetwork: () => {
      dispatch(hideToaster());
      dispatch(retryNetwork());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Toaster);
