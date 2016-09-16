import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import className from 'classnames';
import zxcvbn from 'zxcvbn';

export default class RegisterAccSecretForm extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    error: PropTypes.object.isRequired,
    showToaster: PropTypes.func.isRequired,
    stateContinue: PropTypes.func.isRequired,
    stateBack: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.handleAccSecretForm = this.handleAccSecretForm.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.showPassword = this.showPassword.bind(this);
    this.passwordStrengthValid = false;
  }

  componentWillMount() {
    const { error, showToaster, setErrorMessage } = this.props;
    let errMsg = null;
    if (Object.keys(error).length > 0) {
      errMsg = window.msl.errorCodeLookup(error.errorCode || 0);
      switch (errMsg) {
        case 'CoreError::RequestTimeout':
          errMsg = 'Request timed out';
          break;
        case 'CoreError::MutationFailure::MutationError::AccountExists':
          errMsg = 'This account is already taken.';
          break;
        default:
          errMsg = errMsg.replace('CoreError::', '');
      }
      setErrorMessage(errMsg);
      showToaster(errMsg, { autoHide: true, error: true });
    }
  }

  componentDidMount() {
    const user = (Object.keys(this.props.user).length > 0) ? this.props.user.accountSecret : '';
    this.accountSecret.value = user;
    this.confirmAccountSecret.value = user;
    this.accountSecret.dispatchEvent(new Event('keyup', { bubbles: true }));
  }

  handleAccSecretForm(e) {
    const accountSecretVal = this.accountSecret.value.trim();
    const confirmAccountSecretVal = this.confirmAccountSecret.value.trim();
    const accountSecretMsgEle = $(this.accountSecret).siblings('.msg');
    const parentEle = accountSecretMsgEle.parent();
    const confirmAccountSecretMsgEle = $(this.confirmAccountSecret).siblings('.msg');
    const reset = () => {
      accountSecretMsgEle.text('');
      confirmAccountSecretMsgEle.text('');
    };

    reset();
    if (!accountSecretVal || !confirmAccountSecretVal) {
      return;
    }

    e.preventDefault();

    if (!this.passwordStrengthValid) {
      parentEle.addClass('error');
      accountSecretMsgEle.text('Account secret needs to be stronger.');
      return;
    }

    if (accountSecretVal !== confirmAccountSecretVal) {
      return confirmAccountSecretMsgEle.text('Entries don\'t match.');
    }

    this.props.stateContinue({
      accountSecret: accountSecretVal
    });
  }

  resetInput(e) {
    const ele = $(e.currentTarget);
    const msgEle = ele.siblings('.msg');
    msgEle.text('');
    const parentEle = $('#AccountSecret');
    if (parentEle.hasClass('error')) {
      parentEle.removeClass('error');
      parentEle.children('.msg').text('')
    }
  }

  handleInputChange(e) {
    if (e.keyCode === 13) {
      return;
    }
    if (this.props.errorMsg) {
      this.props.clearErrorMessage();
    }
    const MSG = {
      PASS_VERY_WEEK: 'Very weak',
      PASS_WEEK: 'Weak',
      PASS_SOMEWHAT_SECURE: 'Somewhat secure',
      PASS_SECURE: 'Secure'
    };
    const ele = $(e.currentTarget);
    const parentEle = ele.parent();
    const statusEle = ele.siblings('.status');
    const strengthEle = ele.siblings('.strength');
    const msgEle = ele.siblings('.msg');
    const value = ele.val();
    const log10 = zxcvbn(value).guesses_log10;
    const resetField = () => {
      strengthEle.width('0');
      statusEle.removeClass('icn');
      parentEle.removeClass('error');
      msgEle.text('');
      this.passwordStrengthValid = false;
      return;
    };

    resetField();
    if (!value) {
      return;
    }
    switch (true) {
      case (log10 < 4):
        msgEle.text(MSG.PASS_VERY_WEEK);
        this.passwordStrengthValid = false;
        break;
      case (log10 < 8):
        msgEle.text(MSG.PASS_WEEK);
        this.passwordStrengthValid = false;
        break;
      case (log10 < 10):
        statusEle.addClass('icn');
        msgEle.text(MSG.PASS_SOMEWHAT_SECURE);
        this.passwordStrengthValid = true;
        break;
      case (log10 >= 10):
        statusEle.addClass('icn');
        msgEle.text(MSG.PASS_SECURE);
        this.passwordStrengthValid = true;
        break;
      default:
    }

    strengthEle.width(`${Math.min((log10 / 16) * 100, 100)}%`);
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

  render() {
    const { error, errorMsg } = this.props;

    const inputGrpClassNames = className(
      'inp-grp',
      'validate-field',
      'light-theme',
      { error: errorMsg }
    );

    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Account Secret</h3>
        <div className="desc">
          Your 'account secret' is private and <b>should not be shared</b> with anyone.
        </div>
        <div className="form-b">
          <form id="accountSecretForm" className="form" name="accountSecretForm">
            <div id="AccountSecret" className={inputGrpClassNames}>
              <input
                id="accountSecret"
                type="password"
                ref={c => { this.accountSecret = c; }}
                required="true"
                onKeyUp={this.handleInputChange}
                autoFocus
              />
              <label htmlFor="accountSecret">Account Secret</label>
              <div className="msg">{errorMsg}</div>
              <div className="opt">
                <div className="opt-i">
                  <span
                    className="eye"
                    data-target="accountSecret"
                    onClick={this.showPassword}
                  >{' '}</span>
                </div>
              </div>
              <span className="strength">{' '}</span>
              <span className="status" data-val="min">{' '}</span>
            </div>
            <div id="AccountSecretConfirm" className="inp-grp light-theme">
              <input
                id="confirmAccountSecret"
                type="password"
                ref={c => { this.confirmAccountSecret = c; }}
                required="true"
                onChange={this.resetInput}
              />
              <label htmlFor="confirmAccountSecret">Confirm Account Secret</label>
              <div className="msg">{' '}</div>
              <div className="opt">
                <div className="opt-i">
                  <span
                    className="eye"
                    data-target="confirmAccountSecret"
                    onClick={this.showPassword}
                  >{' '}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="opt">
          <div className="opt-i lt">
            <button
              type="button"
              className="btn"
              name="back"
              onClick={() => {
                this.props.stateBack();
              }}
            >Back</button>
          </div>
          <div className="opt-i">
            <button
              type="submit"
              className="btn"
              name="continue"
              form="accountSecretForm"
              onClick={this.handleAccSecretForm}
            >Continue</button>
          </div>
        </div>
      </div>
    );
  }
}
