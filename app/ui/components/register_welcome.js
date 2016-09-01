import React, { Component, PropTypes } from 'react';

export default class RegisterWelcome extends Component {
  render() {
    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Welcome to the SAFE Launcher!</h3>
        <div className="auth-intro-media">
          <img src="./ui/images/launcher_logo.svg" alt="Welcome to the Safe Launcher" />
        </div>
        <div className="desc">
          Launcher will act as your gateway to the SAFE Network, you can use it to access data on the network and to
          authorise apps to connect on your behalf.
        </div>
        <div className="opt">
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
