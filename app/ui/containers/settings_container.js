import { connect } from 'react-redux';
import Settings from '../components/settings';
import { toggleProxy } from '../actions/proxy_action';

const mapStateToProps = state => ({ proxy: state.proxy.proxy });

const mapDispatchToProps = dispatch => (
  {
    onProxyClick: status => (dispatch(toggleProxy(status)))
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
