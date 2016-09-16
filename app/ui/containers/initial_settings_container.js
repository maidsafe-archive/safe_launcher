import { connect } from 'react-redux';
import InitialSettings from '../components/initial_settings';
import { toggleProxy, finishInitialProxySettings } from '../actions/proxy_action';

const mapStateToProps = state => (
  {
    proxy: state.proxy.proxy,
    initialSettings: state.proxy.initialSettings
  }
);

const mapDispatchToProps = dispatch => (
  {
    onProxyClick: () => (dispatch(toggleProxy())),
    onComplete: () => (dispatch(finishInitialProxySettings()))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(InitialSettings);
