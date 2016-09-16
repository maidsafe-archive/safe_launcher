import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import $ from 'jquery';
import AuthLoader from './auth_loader';
import { MESSAGES } from '../constant';

export default class Settings extends Component {
  static propTypes = {
    error: PropTypes.object.isRequired,
    errorMsg: PropTypes.string,
    user: PropTypes.object.isRequired,
    authenticated: PropTypes.bool.isRequired,
    networkStatus: PropTypes.number.isRequired,
    authProcessing: PropTypes.bool.isRequired,
    userLogin: PropTypes.func.isRequired,
    cancelAuthReq: PropTypes.func.isRequired,
    resetUser: PropTypes.func.isRequired,
    showToaster: PropTypes.func.isRequired,
    setErrorMessage: PropTypes.func.isRequired,
    clearErrorMessage: PropTypes.func.isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.handleLogin = this.handleLogin.bind(this);
    this.checkAuthenticated = this.checkAuthenticated.bind(this);
    this.showPassword = this.showPassword.bind(this);
    this.clearErrMsg = this.clearErrMsg.bind(this);
  }

  componentWillMount() {
    this.checkAuthenticated(this.props, true);
  }

  componentWillUpdate(nextProps) {
    const { error, setErrorMessage, showToaster } = nextProps;
    this.checkAuthenticated(nextProps);
    let errMsg = null;
    if (Object.keys(error).length > 0) {
      errMsg = window.msl.errorCodeLookup(error.errorCode || 0);
      switch (errMsg) {
        case 'CoreError::RequestTimeout':
          errMsg = 'Request timed out';
          break;
        case 'CoreError::GetFailure::GetError::NoSuchAccount':
        case 'CoreError::GetFailure::GetError::NoSuchData':
          errMsg = 'Account not found';
          break;
        case 'CoreError::SymmetricDecipherFailure':
          errMsg = 'Invalid password';
          break;
        default:
          errMsg = errMsg.replace('CoreError::', '');
      }
      errMsg = `Login failed. ${errMsg}`;
      setErrorMessage(errMsg);
      showToaster(errMsg, { autoHide: true, error: true });
    }
  }

  checkAuthenticated(props, onInit) {
    if (props.authenticated) {
      return this.context.router.push('/account_app_list');
    } else if (onInit) {
      props.resetUser();
    }
  }

  showPassword(e) {
    const currentTarget = e.currentTarget;
    if (currentTarget.classList.contains('active')) {
      currentTarget.classList.remove('active');
    } else {
      currentTarget.classList.add('active');
    }
    const targetEle = this[currentTarget.dataset.target];
    if (targetEle.getAttribute('type') === 'text') {
      return targetEle.setAttribute('type', 'password');
    }
    targetEle.setAttribute('type', 'text');
  }

  clearErrMsg(e) {
    if (!this.props.errorMsg || (e.keyCode === 13)) {
      return;
    }
    this.props.clearErrorMessage();
  }

  handleLogin(e) {
    e.preventDefault();
    const { networkStatus, userLogin, showToaster } = this.props;

    if (networkStatus !== 1) {
      showToaster(MESSAGES.NETWORK_NOT_CONNECTED, { autoHide: true });
      console.warn(MESSAGES.NETWORK_NOT_CONNECTED);
      return;
    }

    const accountSecretVal = this.accountSecret.value.trim();
    const accountPasswordVal = this.accountPassword.value.trim();
    if (!accountSecretVal || !accountPasswordVal) {
      return;
    }
    userLogin({
      accountSecret: accountSecretVal,
      accountPassword: accountPasswordVal
    });
  }

  render() {
    const { authProcessing, errorMsg } = this.props;
    if (authProcessing) {
      return <AuthLoader {...this.props} />;
    }

    const inputGrpClassNames = className(
      'inp-grp',
      { error: errorMsg }
    );

    return (
      <div className="form-b">
        <form className="form" name="loginForm" onSubmit={this.handleLogin}>
          <div id="errorTarget" className={inputGrpClassNames}>
            <input
              id="accountSecret"
              type="password"
              ref={c => { this.accountSecret = c; }}
              required="true"
              onKeyUp={this.clearErrMsg}
              autoFocus
            />
            <label htmlFor="accountSecret">Account Secret</label>
            <div className="msg">{errorMsg}</div>
            <div className="opt">
              <div className="opt-i">
                <span
                  className="eye"
                  onClick={this.showPassword}
                  data-target="accountSecret"
                >{' '}</span>
              </div>
            </div>
          </div>
          <div className="inp-grp">
            <input
              id="accountPassword"
              type="password"
              ref={c => { this.accountPassword = c; }}
              required="true"
            />
            <label htmlFor="accountPassword">Account Password</label>
            <div className="msg">{' '}</div>
            <div className="opt">
              <div className="opt-i">
                <span
                  className="eye"
                  data-target="accountPassword"
                  onClick={this.showPassword}
                >{' '}</span>
              </div>
            </div>
          </div>
          <div className="inp-btn">
            <button type="submit" className="btn primary" name="login">Login</button>
          </div>
        </form>
        <div className="form-f">
          <div className="form-f-b">
            Don&rsquo;t have a account ?
            <a
              href={undefined}
              onClick={e => {
                e.preventDefault();
                this.context.router.push('register');
              }}
            >Create Account</a>
          </div>
        </div>
      </div>
    );
  }
}
