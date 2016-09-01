import React, { Component, PropTypes } from 'react';

export default class RegisterAccSecretInfo extends Component {
  render() {
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Account Info</h3>
        <div className="desc">
          Accounts are made of two parts, an 'account secret' and an 'account password'.
        </div>
        <div className="desc">
          Your '<b>account secret</b>' is used to locate your account information on the network.
        </div>
        <div className="auth-intro-media sm">
          <img src="./ui/images/account_secret.svg" alt="Welcome to the Safe Launcher" />
        </div>
        <div className="opt">
          <div className="opt-i lt">
            <button type="button" className="btn" name="back" onClick={e => {
              this.props.stateBack()
            }}>Back</button>
          </div>
          <div className="opt-i">
            <button type="button" className="btn" name="continue" onClick={e => {
              this.props.stateContinue()
            }}>Continue</button>
          </div>
        </div>
      </div>
    )
  }
}
