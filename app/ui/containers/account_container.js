import { connect } from 'react-redux';
import Account from '../components/account';

const mapStateToProps = function(state) {
  return {
    authenticated: state.auth.authenticated
  };
}

const mapDispatchToProps = function(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Account);
