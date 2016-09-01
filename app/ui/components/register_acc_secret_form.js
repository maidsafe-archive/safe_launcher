import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import zxcvbn from 'zxcvbn';

export default class RegisterAccSecretForm extends Component {
  constructor() {
    super();
    this.handleAccSecretForm = this.handleAccSecretForm.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.showPassword = this.showPassword.bind(this);
    this.passwordStrengthValid = false;
  }

  handleAccSecretForm(e) {
    let accountSecretVal = accountSecret.value.trim();
    let confirmAccountSecretVal = confirmAccountSecret.value.trim();
    let accountSecretMsgEle = $(accountSecret).siblings('.msg');
    let confirmAccountSecretMsgEle = $(confirmAccountSecret).siblings('.msg');
    let reset = () => {
      accountSecretMsgEle.text('');
      confirmAccountSecretMsgEle.text('');
    };

    reset();
    if (!accountSecretVal || !confirmAccountSecretVal) {
      return;
    }

    e.preventDefault();

    if (!this.passwordStrengthValid) {
      accountSecretMsgEle.text('Account secret needs to be stronger.');
      return;
    }

    if (accountSecretVal !== confirmAccountSecretVal) {
      return confirmAccountSecretMsgEle.text('Entries don\'t match.')
    }

    this.props.stateContinue({
      accountSecret: accountSecretVal
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
        statusEle.addClass('icn');
        msgEle.text(MSG.PASS_SOMEWHAT_SECURE);
        self.passwordStrengthValid = true;
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

  componentDidMount() {
    let user = this.props.user ? this.props.user.accountSecret : '';
    accountSecret.value = user;
    confirmAccountSecret.value = user;
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

  render() {
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Account Secret</h3>
        <div className="desc">
          Your 'account secret' is private and <b>should not be shared</b> with anyone.
        </div>
        <div className="form-b">
          <form id="accountSecretForm" className="form" name="accountSecretForm">
            <div id="AccountSecret" className="inp-grp validate-field light-theme">
              <input id="accountSecret" type="password" ref="accountSecret" required="true" onKeyUp={this.handleInputChange} autoFocus />
              <label htmlFor="accountSecret">Account Secret</label>
              <div className="msg"></div>
              <div className="opt">
                <div className="opt-i">
                    <span className="eye" data-target="accountSecret" onClick={this.showPassword}></span>
                </div>
              </div>
              <span className="strength"></span>
              <span className="status" data-val="min"></span>
            </div>
            <div id="AccountSecretConfirm" className="inp-grp light-theme">
              <input id="confirmAccountSecret" type="password" ref="confirmAccountSecret" required="true" onChange={this.resetInput} />
              <label htmlFor="confirmAccountSecret">Confirm Account Secret</label>
              <div className="msg"></div>
              <div className="opt">
                <div className="opt-i">
                    <span className="eye"  data-target="confirmAccountSecret" onClick={this.showPassword}></span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="opt">
          <div className="opt-i lt">
            <button type="button" className="btn" name="back" onClick={e => {
              this.props.stateBack()
            }}>Back</button>
          </div>
          <div className="opt-i">
            <button type="submit" className="btn" name="continue" form="accountSecretForm" onClick={this.handleAccSecretForm}>Continue</button>
          </div>
        </div>
      </div>
    )
  }
}
