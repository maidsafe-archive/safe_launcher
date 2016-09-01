import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import RegisterWelcome from './register_welcome.js';
import RegisterAccSecretInfo from './register_acc_secret_info.js';
import RegisterAccSecretForm from './register_acc_secret_form.js';
import RegisterAccPassInfo from './register_acc_pass_info.js';
import RegisterAccPassForm from './register_acc_pass_form.js';
import AuthLoader from './auth_loader';

export default class Register extends Component {

  constructor() {
    super();
    this.checkAuthenticated = this.checkAuthenticated.bind(this);
  }

  static propTypes = {
    stateContinue: PropTypes.func.isRequired,
    stateBack: PropTypes.func.isRequired,
    setRegisterState: PropTypes.func.isRequired,
    cancelAuthReq: PropTypes.func.isRequired,
    userRegister: PropTypes.func.isRequired
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  checkAuthenticated(props) {
    if (props.authenticated) {
      return this.context.router.push('/account_app_list');
    }
  }

  componentWillMount() {
    this.checkAuthenticated(this.props);
  }

  componentWillUpdate(nextProps) {
    this.checkAuthenticated(nextProps);
  }

  render() {
    const { registerState, authProcessing, error, registerStateNext, registerStateBack, setRegisterState } = this.props;
    if (authProcessing) {
      return <AuthLoader { ...this.props }/>
    }
    this.errMsg = null;
    if (error) {
      this.errMsg = window.msl.errorCodeLookup(error.errorCode || 0);
      switch (this.errMsg) {
        case 'CoreError::RequestTimeout':
          this.errMsg = 'Request timed out';
          break;
        case 'CoreError::MutationFailure::MutationError::AccountExists':
          this.errMsg = 'This account is already taken.';
          break;
        default:
          this.errMsg = errMsg.replace('CoreError::', '');
      }
    }

    let currentState = null;
    const TOTAL_STATES = 5;
    switch (registerState) {
      case 0:
        currentState = <RegisterWelcome { ...this.props } />;
        break;
      case 1:
        currentState = <RegisterAccSecretInfo { ...this.props } />;
        break;
      case 2:
        currentState = <RegisterAccSecretForm { ...this.props } />;
        break;
      case 3:
        currentState = <RegisterAccPassInfo { ...this.props } />;
        break;
      case 4:
        currentState = <RegisterAccPassForm { ...this.props } />;
        break;
      default:
        throw new Error('Unkown Register State');
    }
    let stateNavs = [];
    let navClassNames = null;
    for (let i = 0; i < TOTAL_STATES; i++) {
      navClassNames = className(
        'auth-intro-nav-btn-i',
        { 'active': i === registerState }
      )
      stateNavs.push(<span key={i} className={navClassNames} onClick={e => {
        setRegisterState(i)
      }}></span>)
    }
    return (
      <div className="auth-intro form-b">
        <div className="auth-intro-b">
          { currentState }
          <div className="auth-intro-nav-btn">
            {stateNavs}
          </div>
        </div>
        <div className="form-f">
          <div className="form-f-b no-border">
            Already have an account? <a href="#" onClick={e => {
              e.preventDefault();
              this.context.router.push('/login');
            }}>Login</a>
          </div>
        </div>
      </div>
    )
  }
}
