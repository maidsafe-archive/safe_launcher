import React, { Component, PropTypes } from 'react';

export default class RegisterAccPassInfo extends Component {
  render() {
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Account Password</h3>
        <div className="desc">
          The '<b>account password</b>' is used to unlock and access all of your data.
        </div>
        <div className="auth-intro-media">
          <img src="./ui/images/account_password.svg" alt="Welcome to the Safe Launcher" />
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
