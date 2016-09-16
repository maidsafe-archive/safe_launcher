import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import zxcvbn from 'zxcvbn';
import { MESSAGES } from '../constant';

export default class RegisterAccPassForm extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    networkStatus: PropTypes.number.isRequired,
    showToaster: PropTypes.func.isRequired,
    userRegister: PropTypes.func.isRequired,
    stateBack: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.handleAccPassForm = this.handleAccPassForm.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.showPassword = this.showPassword.bind(this);
    this.passwordStrengthValid = false;
  }

  componentDidMount() {
    const user = ((Object.keys(this.props.user).length > 0) && this.props.user.accountPassword) ?
      this.props.user.accountPassword : '';
    this.accountPassword.value = user;
    this.confirmAccountPassword.value = user;
  }

  handleAccPassForm(e) {
    if (this.props.networkStatus !== 1) {
      this.props.showToaster(MESSAGES.NETWORK_NOT_CONNECTED, { autoHide: true });
      console.warn(MESSAGES.NETWORK_NOT_CONNECTED);
      return;
    }
    const accountPasswordVal = this.accountPassword.value.trim();
    const confirmAccountPasswordVal = this.confirmAccountPassword.value.trim();
    const accountPasswordMsgEle = $(this.accountPassword).siblings('.msg');
    const confirmAccountPasswordMsgEle = $(this.confirmAccountPassword).siblings('.msg');

    const reset = () => {
      accountPasswordMsgEle.text('');
      confirmAccountPasswordMsgEle.text('');
    };

    reset();
    if (!accountPasswordVal || !confirmAccountPasswordVal) {
      return;
    }

    e.preventDefault();

    if (!this.passwordStrengthValid) {
      accountPasswordMsgEle.text('Account secret needs to be stronger.');
      return;
    }

    if (accountPasswordVal !== confirmAccountPasswordVal) {
      return confirmAccountPasswordMsgEle.text('Entries don\'t match.');
    }

    this.props.userRegister({
      accountSecret: this.props.user.accountSecret,
      accountPassword: accountPasswordVal
    });
  }

  resetInput(e) {
    const ele = $(e.currentTarget);
    const msgEle = ele.siblings('.msg');
    msgEle.text('');
  }

  handleInputChange(e) {
    if (e.keyCode === 13) {
      return;
    }
    const MSG = {
      PASS_VERY_WEEK: 'Very weak',
      PASS_WEEK: 'Weak',
      PASS_SOMEWHAT_SECURE: 'Somewhat secure',
      PASS_SECURE: 'Secure'
    };
    const ele = $(e.currentTarget);
    const statusEle = ele.siblings('.status');
    const strengthEle = ele.siblings('.strength');
    const msgEle = ele.siblings('.msg');
    const value = ele.val();
    const log10 = zxcvbn(value).guesses_log10;
    const resetField = () => {
      strengthEle.width('0');
      statusEle.removeClass('icn');
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
        msgEle.text(MSG.PASS_SOMEWHAT_SECURE);
        this.passwordStrengthValid = false;
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
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Account Password</h3>
        <div className="desc">
          Your 'account password' is <b>never stored or transmitted</b>,
          it will not leave your computer.
        </div>
        <div className="form-b">
          <form id="accountPasswordForm" className="form" name="accountPasswordForm">
            <div id="AccountPass" className="inp-grp validate-field light-theme">
              <input
                id="accountPassword"
                type="password"
                ref={c => { this.accountPassword = c; }}
                required="true"
                onChange={this.handleInputChange}
                autoFocus
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
              <span className="strength">{' '}</span>
              <span className="status last" data-val="min">{' '}</span>
            </div>
            <div id="AccountPassConfirm" className="inp-grp light-theme">
              <input
                id="confirmAccountPassword"
                type="password"
                ref={c => { this.confirmAccountPassword = c; }}
                required="true"
                onChange={this.handleInputMatch}
              />
              <label htmlFor="confirmAccountPassword">Confirm Account Password</label>
              <div className="msg">{' '}</div>
              <div className="opt">
                <div className="opt-i">
                  <span
                    className="eye"
                    data-target="confirmAccountPassword"
                    onClick={this.showPassword}
                  >{' '}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="opt align-btn-box">
          <div className="opt-i lt">
            <button
              type="button lt"
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
              className="btn btn-box"
              name="continue"
              form="accountPasswordForm"
              onClick={this.handleAccPassForm}
            >Create Account</button>
          </div>
        </div>
      </div>
    );
  }
}
