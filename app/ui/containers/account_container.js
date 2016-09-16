import { connect } from 'react-redux';
import Account from '../components/account';

const mapStateToProps = state => (
  {
    authenticated: state.auth.authenticated
  }
);

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Account);
