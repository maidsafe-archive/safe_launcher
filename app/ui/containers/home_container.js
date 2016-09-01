import { connect } from 'react-redux';
import Home from '../components/home';

const mapStateToProps = function(state) {
  return {
    authProcessing: state.auth.authProcessing
  };
}

const mapDispatchToProps = function(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
