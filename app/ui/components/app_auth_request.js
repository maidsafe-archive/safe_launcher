import React, { Component, PropTypes } from 'react';
import AuthRequestPermissions from './auth_request_permissions';

export default class AppAuthRequest extends Component {
  static propTypes = {
    authRequestPayload: PropTypes.object.isRequired,
    authRequestHasNext: PropTypes.bool.isRequired,
    showNextAuthRequest: PropTypes.func.isRequired,
    hideAuthRequest: PropTypes.func.isRequired,
    showSpinner: PropTypes.func
  };

  render() {
    const {
      authRequestPayload,
      authRequestHasNext,
      showNextAuthRequest,
      hideAuthRequest,
      showSpinner
    } = this.props;

    return (
      <div className="auth-req">
        <div className="auth-req-b">
          <div className="auth-req-ctn">
            <h3 className="title">Authorise Request:</h3>
            <div className="details">
              <div className="desc">
                <div className="desc-i">
                  <span className="desc-i-h">App Name:</span>
                  <span className="desc-i-ctx">{authRequestPayload.payload.app.name}</span>
                </div>
                <div className="desc-i">
                  <span className="desc-i-h">Vendor:</span>
                  <span className="desc-i-ctx">{authRequestPayload.payload.app.vendor}</span>
                </div>
                <div className="desc-i">
                  <span className="desc-i-h">Version:</span>
                  <span className="desc-i-ctx">{authRequestPayload.payload.app.version}</span>
                </div>
              </div>
              <AuthRequestPermissions permissions={authRequestPayload.permissions.list} />
              <div className="auth-req-f">
                <div className="auth-req-f-i">
                  <button
                    type="button"
                    className="btn flat primary"
                    name="deny"
                    onClick={e => {
                      e.preventDefault();
                      hideAuthRequest(authRequestPayload, false);
                    }}
                  >Deny</button>
                </div>
                <div className="auth-req-f-i">
                  <button
                    type="button"
                    className="btn flat primary"
                    name="allow"
                    onClick={e => {
                      e.preventDefault();
                      showSpinner();
                      return (authRequestHasNext ? showNextAuthRequest(authRequestPayload, true) :
                        hideAuthRequest(authRequestPayload, true));
                    }}
                  >Allow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
