import React, { Component, PropTypes } from 'react';
import AppDetail from './app_detail';
import AppAuthRequest from './app_auth_request';
import AppList from './app_list';

export default class AccountAppList extends Component {
  static propTypes = {
    appList: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    appDetailPageVisible: PropTypes.bool.isRequired,
    authenticated: PropTypes.bool.isRequired,
    authRequestPayload: PropTypes.object.isRequired,
    authRequestHasNext: PropTypes.bool.isRequired,
    showAppDetailPage: PropTypes.func.isRequired,
    hideAppDetailPage: PropTypes.func.isRequired,
    hideAuthRequest: PropTypes.func.isRequired,
    showAuthRequest: PropTypes.bool.isRequired,
    resetLogsFilter: PropTypes.func.isRequired,
    showNextAuthRequest: PropTypes.func.isRequired,
    revokeApplication: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentWillMount() {
    if (!this.props.authenticated) {
      return this.context.router.push('/login');
    }
    this.props.resetLogsFilter();
  }

  compentWillUpdate() {
    if (!this.props.authenticated) {
      return this.context.router.push('/login');
    }
  }

  render() {
    const {
      user,
      appDetailPageVisible,
      showAuthRequest,
      authRequestPayload,
      authRequestHasNext,
      showNextAuthRequest,
      hideAuthRequest,
      logout
    } = this.props;
    if (appDetailPageVisible) {
      return <AppDetail {...this.props} />;
    }
    return (
      <div className="app-li">
        <div className="app-li-b">
          <div className="app-li-h">
            <div className="app-li-h-lt">
              Authorised Apps
            </div>
            <div className="app-li-h-rt">
              <button
                type="button"
                className="btn logout"
                name="logout"
                onClick={e => {
                  e.preventDefault();
                  logout(user);
                }}
              >Logout
              </button>
            </div>
          </div>
          <AppList {...this.props} />
        </div>
        { showAuthRequest ? <AppAuthRequest
          authRequestPayload={authRequestPayload}
          hideAuthRequest={hideAuthRequest}
          authRequestHasNext={authRequestHasNext}
          showNextAuthRequest={showNextAuthRequest}
        /> : null }
      </div>
    );
  }
}
