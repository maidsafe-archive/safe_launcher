import React, { Component, PropTypes } from 'react';

class Permission extends Component {
  constructor() {
    super()
  }

  render() {
    const { type } = this.props;

    if (type === 'SAFE_DRIVE_ACCESS') {
      return (
        <div className="permissions-i icn safe-drive">
          <input type="checkbox" name="safeDrivePermission" id="safeDrivePermission" />
          <label htmlFor="safeDrivePermission" className="permissions-name">SAFE Drive Access</label>
          <p className="permissions-desc">
            Allow this app to access the data stored in your SAFE Drive.
          </p>
        </div>
      )
    }

    return (
      <div className="permissions-i">
        <label htmlFor="safeDrivePermission" className="permissions-name none">None</label>
      </div>
    )
  }
}

class AuthRequestPermissions extends Component {
  constructor() {
    super()
  }

  render() {
    const { permissions } = this.props;

    return (
      <div className="permissions">
        <h4 className="permissions-h">Permissions:</h4>
        {
          permissions.length === 0 ? <Permission /> : permissions.map((permission, i) => {
            return <Permission key={i} type={permission} />
          })
        }
      </div>
    )
  }
}

export default class AppAuthRequest extends Component {
  constructor() {
    super();
  }

  render() {
    const { authRequestPayload, authRequestHasNext, showNextAuthRequest, hideAuthRequest } = this.props;

    return (
      <div className="auth-req">
        <div className="auth-req-b">
          <div className="auth-req-ctn">
            <h3 className="title">Authorise Request:</h3>
            <div className="details">
              <div className="desc">
                <div className="desc-i">
                  <span className="desc-i-h">App Name:</span>
                  <span className="desc-i-ctx">{ authRequestPayload.payload.app.name }</span>
                </div>
                <div className="desc-i">
                  <span className="desc-i-h">Vendor:</span>
                  <span className="desc-i-ctx">{ authRequestPayload.payload.app.vendor }</span>
                </div>
                <div className="desc-i">
                  <span className="desc-i-h">Version:</span>
                  <span className="desc-i-ctx">{ authRequestPayload.payload.app.version }</span>
                </div>
              </div>
              <AuthRequestPermissions permissions={ authRequestPayload.permissions.list } />
              <div className="auth-req-f">
                <div className="auth-req-f-i">
                  <button type="button" className="btn flat primary" name="deny" onClick={e => {
                    e.preventDefault();
                    hideAuthRequest(authRequestPayload, false)
                  }}>Deny</button>
                </div>
                <div className="auth-req-f-i">
                  <button type="button" className="btn flat primary" name="allow" onClick={e => {
                    e.preventDefault();
                    return (authRequestHasNext ? showNextAuthRequest(authRequestPayload, true) : hideAuthRequest(authRequestPayload, true));
                  }}>Allow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
