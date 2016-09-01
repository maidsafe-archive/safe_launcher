import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import zxcvbn from 'zxcvbn';

export default class RegisterAccPassForm extends Component {
  constructor() {
    super();
    this.handleAccPassForm = this.handleAccPassForm.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.showPassword = this.showPassword.bind(this);
    this.passwordStrengthValid = false;
  }

  handleAccPassForm(e) {
    if (this.props.networkStatus !== 1) {
      console.log('Network not connected yet!');
      return;
    }
    let accountPasswordVal = accountPassword.value.trim();
    let confirmAccountPasswordVal = confirmAccountPassword.value.trim();
    let accountPasswordMsgEle = $(accountPassword).siblings('.msg');
    let confirmAccountPasswordMsgEle = $(confirmAccountPassword).siblings('.msg');

    let reset = () => {
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
      return confirmAccountPasswordMsgEle.text('Entries don\'t match.')
    }

    this.props.userRegister({
      accountSecret: this.props.user.accountSecret,
      accountPassword: accountPasswordVal
    });
  }

  resetInput(e) {
    let ele = $(e.currentTarget);
    let msgEle = ele.siblings('.msg');
    msgEle.text('');
  }

  handleInputChange(e) {
    if (e.keyCode == 13) {
      return;
    }
    let self = this;
    const MSG = {
      'PASS_VERY_WEEK': 'Very weak',
      'PASS_WEEK': 'Weak',
      'PASS_SOMEWHAT_SECURE': 'Somewhat secure',
      'PASS_SECURE': 'Secure'
    };
    let ele = $(e.currentTarget);
    let statusEle = ele.siblings('.status');
    let strengthEle = ele.siblings('.strength');
    let msgEle = ele.siblings('.msg');
    let value = ele.val();
    let log10 = zxcvbn(value).guesses_log10;
    let resetField = function() {
      strengthEle.width('0');
      statusEle.removeClass('icn');
      msgEle.text('');
      self.passwordStrengthValid = false;
      return;
    };
    resetField();
    if (!value) {
      return;
    }
    switch (true) {
      case (log10 < 4):
        msgEle.text(MSG.PASS_VERY_WEEK);
        self.passwordStrengthValid = false;
        break;
      case (log10 < 8):
        msgEle.text(MSG.PASS_WEEK);
        self.passwordStrengthValid = false;
        break;
      case (log10 < 10):
        msgEle.text(MSG.PASS_SOMEWHAT_SECURE);
        self.passwordStrengthValid = false;
        break;
      case (log10 >= 10):
        statusEle.addClass('icn');
        msgEle.text(MSG.PASS_SECURE);
        self.passwordStrengthValid = true;
        break;
      default:
    }
    strengthEle.width(Math.min((log10 / 16) * 100, 100) + '%');
  }

  showPassword(e) {
    const currentTarget = e.currentTarget;
    if (currentTarget.classList.contains('active')) {
      currentTarget.classList.remove('active');
    } else {
      currentTarget.classList.add('active');
    }
    const targetEle = this.refs[currentTarget.dataset.target];
    if (targetEle.getAttribute('type') === 'text') {
      return targetEle.setAttribute('type', 'password');
    }
    targetEle.setAttribute('type', 'text');
  }

  componentDidMount() {
    let user = (this.props.user && this.props.user.accountPassword) ? this.props.user.accountPassword : '';
    accountPassword.value = user;
    confirmAccountPassword.value = user;
  }

  render() {
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Account Password</h3>
        <div className="desc">
          Your 'account password' is <b>never stored or transmitted</b>, it will not leave your computer.
        </div>
        <div className="form-b">
          <form id="accountPasswordForm" className="form" name="accountPasswordForm">
            <div id="AccountPass" className="inp-grp validate-field light-theme">
              <input id="accountPassword" type="password" ref="accountPassword" required="true" autoFocus onChange={this.handleInputChange} />
              <label htmlFor="accountPassword">Account Password</label>
              <div className="msg"></div>
              <div className="opt">
                <div className="opt-i">
                    <span className="eye" data-target="accountPassword" onClick={this.showPassword}></span>
                </div>
              </div>
              <span className="strength"></span>
              <span className="status last" data-val="min"></span>
            </div>
            <div id="AccountPassConfirm" className="inp-grp light-theme">
              <input id="confirmAccountPassword" type="password" ref="confirmAccountPassword" required="true" onChange={this.handleInputMatch} />
              <label htmlFor="confirmAccountPassword">Confirm Account Password</label>
              <div className="msg"></div>
              <div className="opt">
                <div className="opt-i">
                    <span className="eye" data-target="confirmAccountPassword" onClick={this.showPassword}></span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="opt align-btn-box">
          <div className="opt-i lt">
            <button type="button lt" className="btn" name="back" onClick={e => {
              this.props.stateBack()
            }}>Back</button>
          </div>
          <div className="opt-i">
            <button type="submit" className="btn btn-box" name="continue" form="accountPasswordForm" onClick={this.handleAccPassForm}>Create Account</button>
          </div>
        </div>
      </div>
    )
  }
}
