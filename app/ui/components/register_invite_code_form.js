import React, { Component, PropTypes } from 'react';
import $ from 'jquery';

export default class RegisterVerificationForm extends Component {
  constructor() {
    super();
    this.inviteToken = null;
    this.handleAccPassForm = this.handleAccPassForm.bind(this);
    this.openVerificationWindow = this.openVerificationWindow.bind(this);
    this.clearErrorMsg = this.clearErrorMsg.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    const user = ((Object.keys(this.props.user).length > 0) && this.props.user.inviteToken) ?
      this.props.user.inviteToken : '';
    this.inviteToken.value = user;
    this.inviteToken.dispatchEvent(new Event('change', { bubbles: true }));
  }

  handleAccPassForm(e) {
    const inviteToken = this.inviteToken.value.trim();
    if (!inviteToken) {
      return;
    }
    e.preventDefault();

    this.props.stateContinue({
      inviteToken
    });
  }

  clearErrorMsg() {
    if (this.props.errorMsg) {
      this.props.clearErrorMessage();
    }
  }

  handleInputChange(e) {
    if (e.keyCode === 13) {
      return;
    }
    this.clearErrorMsg();
  }

  openVerificationWindow() {
    const self = this;
    const url = 'https://nodejs-sample-163104.appspot.com/';
    const ipc = require('electron').ipcRenderer;
    const BrowserWindow = require('electron').remote.BrowserWindow;
    ipc.on('messageFromMain', (event, res) => {
      if (res.err) {
        return self.props.setErrorMessage(res.err);
      }
      console.log(`message from main: ${res.invite}`);
      self.inviteToken.value = res.invite;
    });
    let win = new BrowserWindow({width: 750, height: 560, resizable: false});
    // win.webContents.openDevTools();
    win.on('close', () => {
      win = null;
    });
    win.loadURL(url);
    // win.webContents.on('did-finish-load', () => {
    //   win.show();
    //   win.focus();
    // });
    win.show();
  }

  render() {
    const { errorMsg } = this.props;

    return (
      <div className="auth-intro-cnt">
        <h3 className="title">Invitation Token</h3>
        <div className="desc">
          Enter an invitation token or click on the "Claim an invitation" button.
        </div>
        <div className="form-b">
          <form id="inviteTokenForm" className="form" name="inviteTokenForm">
            <div id="inviteToken" className="inp-grp validate-field light-theme">
              <input
                id="inviteToken"
                type="test"
                className="normal-pad"
                ref={c => { this.inviteToken = c; }}
                required="true"
                onChange={this.handleInputChange}
                autoFocus
              />
              <label htmlFor="inviteToken">Invitation Token</label>
              <div className="msg">{errorMsg}</div>
            </div>
            <div className="claim-invite">
              <div className="separator">Or</div>
              <button className="btn" type="button" onClick={e => {
                e.preventDefault();
                this.openVerificationWindow();
              }}>Claim an invitation</button>
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
              className="btn"
              name="continue"
              form="inviteTokenForm"
              onClick={this.handleAccPassForm}
            >Continue</button>
          </div>
        </div>
      </div>
    );
  }
}
