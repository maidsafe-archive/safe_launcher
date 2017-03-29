import React, { Component, PropTypes } from 'react';
import { openExternal } from '../utils/app_utils';

export default class RegisterVerificationForm extends Component {
  constructor() {
    super();
    this.inviteCode = null;
    this.handleAccPassForm = this.handleAccPassForm.bind(this);
  }

  handleAccPassForm(e) {
    if (this.props.networkStatus !== 1) {
      this.props.showToaster(MESSAGES.NETWORK_NOT_CONNECTED, { autoHide: true });
      console.warn(MESSAGES.NETWORK_NOT_CONNECTED);
      return;
    }
    const verificationCode = this.inviteCode.value.trim();
    if (!verificationCode) {
      return;
    }
    e.preventDefault();

    this.props.userRegister({
      accountSecret: this.props.user.accountSecret,
      accountPassword: this.props.user.accountPassword,
      inviteCode
    });
  }

  render() {
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Invite Code</h3>
        <div className="desc">
          Get invite code from <a href={undefined}
                                  onClick={e => {
                                    e.preventDefault();
                                    openExternal('https://safenetforum.org/');
                                  }}>SAFE Network Forum<a>, if you don't have an invite
        </div>
        <div className="form-b">
          <form id="inviteCodeForm" className="form" name="inviteCodeForm">
            <div id="inviteCode" className="inp-grp validate-field light-theme">
              <input
                id="inviteCode"
                type="test"
                ref={c => { this.inviteCode = c; }}
                required="true"
                autoFocus
              />
              <label htmlFor="inviteCode">Invite Code</label>
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
