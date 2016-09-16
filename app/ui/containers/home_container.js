import { connect } from 'react-redux';
import Home from '../components/home';

const mapStateToProps = state => (
  {
    authProcessing: state.auth.authProcessing
  }
);

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Home);
