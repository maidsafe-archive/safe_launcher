import React, { Component, PropTypes } from 'react';
import className from 'classnames';
import RegisterWelcome from './register_welcome.js';
import RegisterAccSecretInfo from './register_acc_secret_info.js';
import RegisterAccSecretForm from './register_acc_secret_form.js';
import RegisterAccPassInfo from './register_acc_pass_info.js';
import RegisterAccPassForm from './register_acc_pass_form.js';
import AuthLoader from './auth_loader';
import {
  appVersion,
  getVersionFromLocalStorage,
  setVersionToLocalStorage
} from '../utils/app_utils';

export default class Register extends Component {
  static propTypes = {
    networkStatus: PropTypes.number.isRequired,
    registerState: PropTypes.number.isRequired,
    authProcessing: PropTypes.bool.isRequired,
    user: PropTypes.object.isRequired,
    error: PropTypes.object.isRequired,
    authenticated: PropTypes.bool.isRequired,
    stateContinue: PropTypes.func.isRequired,
    stateBack: PropTypes.func.isRequired,
    setRegisterState: PropTypes.func.isRequired,
    cancelAuthReq: PropTypes.func.isRequired,
    userRegister: PropTypes.func.isRequired,
    showToaster: PropTypes.func.isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.checkAuthenticated = this.checkAuthenticated.bind(this);
  }

  componentWillMount() {
    const appVersionInLocalStorage = getVersionFromLocalStorage();
    if (appVersionInLocalStorage !== appVersion) {
      setVersionToLocalStorage(appVersion);
    }
    this.checkAuthenticated(this.props);
  }

  componentWillUpdate(nextProps) {
    this.checkAuthenticated(nextProps);
  }

  checkAuthenticated(props) {
    if (props.authenticated) {
      return this.context.router.push('/account_app_list');
    }
  }

  render() {
    const { registerState, authProcessing, setRegisterState } = this.props;
    if (authProcessing) {
      return (<AuthLoader {...this.props} />);
    }

    let currentState = null;
    const TOTAL_STATES = 5;
    switch (registerState) {
      case 0:
        currentState = <RegisterWelcome {...this.props} />;
        break;
      case 1:
        currentState = <RegisterAccSecretInfo {...this.props} />;
        break;
      case 2:
        currentState = <RegisterAccSecretForm {...this.props} />;
        break;
      case 3:
        currentState = <RegisterAccPassInfo {...this.props} />;
        break;
      case 4:
        currentState = <RegisterAccPassForm {...this.props} />;
        break;
      default:
        throw new Error('Unkown Register State');
    }
    const stateNavs = [];
    let navClassNames = null;
    for (let i = 0; i < TOTAL_STATES; i++) {
      navClassNames = className(
        'auth-intro-nav-btn-i',
        { active: (i === registerState) }
      );
      stateNavs.push(
        <span
          key={i}
          className={navClassNames}
          onClick={() => {
            setRegisterState(i);
          }}
        >{' '}</span>);
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
            Already have an account?
            <a
              href={undefined}
              onClick={e => {
                e.preventDefault();
                this.context.router.push('/login');
              }}
            >Login</a>
          </div>
        </div>
      </div>
    );
  }
}
